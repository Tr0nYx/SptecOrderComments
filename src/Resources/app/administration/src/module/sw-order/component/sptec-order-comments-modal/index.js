import template from './sptec-order-comments-modal.html.twig';
import './sptec-order-comments-modal.scss';

const { Component, Context, Utils } = Shopware;
const { mapPropertyErrors } = Component.getComponentHelper();
const Criteria = Shopware.Data.Criteria;
const { isEmpty } = Utils.types;

Component.register('sptec-order-comments-modal', {
    template,

    inject: [
        'repositoryFactory',
        'acl',
    ],

    props: {
        orderId: {
            type: String,
            required: true,
        },
        orderCommentId: {
            type: String,
            required: false,
            default: null,
        },
    },

    data() {
        return {
            isLoading: true,
            orderComment: undefined,
            currentUser: null,
            mediaModalIsOpen: false,
            taskOptions: [
                {
                    value: null,
                    label: this.$tc('sptec-order-comments.modal.taskNull'),
                },
                {
                    value: true,
                    label: this.$tc('sptec-order-comments.modal.taskTrue'),
                },
                {
                    value: false,
                    label: this.$tc('sptec-order-comments.modal.taskFalse'),
                },
            ],
        };
    },

    computed: {
        ...mapPropertyErrors('orderComment', ['content']),

        orderCommentRepository() {
            return this.repositoryFactory.create('sptec_order_comment');
        },

        primaryActionDisabled() {
            const disabled = !this.orderComment || !this.orderComment.content || this.orderComment.content === '';
            console.log('DEBUG primaryActionDisabled:', {
                hasOrderComment: !!this.orderComment,
                content: this.orderComment?.content,
                disabled: disabled
            });
            return disabled;
        },

        userName() {
            if (this.orderComment.createdBy) {
                return `${this.orderComment.createdBy.firstName} ${this.orderComment.createdBy.lastName}`;
            }

            if (!this.currentUser) {
                return '';
            }

            return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        },

        orderCommentMediaRepository() {
            return this.repositoryFactory.create('sptec_order_comment_media');
        },

        orderCommentCriteria() {
            const criteria = new Criteria(1, 100);

            criteria
                .addAssociation('createdBy')
                .addAssociation('media');

            return criteria;
        },

        taskOptionClass() {
            if (this.orderComment.task === true) {
                return 'orange';
            }

            if (this.orderComment.task === false) {
                return 'green';
            }

            return 'gray';
        },

        date() {
            return Shopware.Filter.getByName('date');
        },
    },

    created() {
        this.loadCurrentUser().then(() => {
            this.createdComponent();
        });
    },

    methods: {
        loadCurrentUser() {
            // In Shopware 6.7, use Shopware.Store instead of Shopware.State
            const sessionStore = Shopware.Store.get('session');
            if (sessionStore && sessionStore.currentUser) {
                this.currentUser = sessionStore.currentUser;
                return Promise.resolve();
            }

            console.error('Could not load current user from session store');
            return Promise.resolve();
        },

        createdComponent() {
            if (this.orderCommentId) {
                this.getOrderComment();
                return;
            }

            this.orderComment = this.orderCommentRepository.create(Shopware.Context.api);
            if (this.currentUser) {
                this.orderComment.createdById = this.currentUser.id;
            }
            this.orderComment.orderId = this.orderId;
            this.orderComment.content = ''; // Initialize content explicitly
            this.orderComment.internal = true;
            this.orderComment.task = null;
            this.isLoading = false;

            console.log('DEBUG createdComponent - orderComment:', this.orderComment);
        },

        onContentChange(value) {
            console.log('DEBUG onContentChange called with:', value);
            this.orderComment.content = value;
            console.log('DEBUG orderComment.content is now:', this.orderComment.content);
        },

        closeModal() {
            this.$emit('close-modal');
        },

        saveComment() {
            this.orderCommentRepository.save(this.orderComment, Shopware.Context.api).then(() => {
                this.closeModal();
                this.$emit('reload-order-comments');
            });
        },

        getOrderComment() {
            this.isLoading = true;
            this.orderCommentRepository
                .get(this.orderCommentId, Shopware.Context.api, this.orderCommentCriteria)
                .then(orderComment => {
                    this.orderComment = orderComment;
                    this.isLoading = false;
                });
        },

        createMediaAssociation(id) {
            const orderCommentMedia = this.orderCommentMediaRepository.create(Context.api);
            orderCommentMedia.mediaId = id;

            return orderCommentMedia;
        },

        onOpenMediaModal() {
            this.mediaModalIsOpen = true;
        },

        onCloseMediaModal() {
            this.mediaModalIsOpen = false;
        },

        onImageUpload({ targetId }) {
            if (this.orderComment.media.find((mediaItem) => mediaItem.mediaId === targetId)) {
                return;
            }

            const orderCommentMedia = this.createMediaAssociation(targetId);
            this.orderComment.media.add(orderCommentMedia);
        },

        onItemRemove(mediaItem) {
            this.orderComment.media.remove(mediaItem.id);
        },

        onUploadFailed({ targetId }) {
            const toRemove = this.orderComment.media.find((mediaItem) => {
                return mediaItem.mediaId === targetId;
            });
            if (toRemove) {
                this.orderComment.media.remove(toRemove.id);
            }
        },

        onMediaSelectionChange(mediaItems) {
            if (isEmpty(mediaItems)) {
                return;
            }

            mediaItems.forEach((mediaItem) => {
                if (!this.isExistingMedia(mediaItem)) {
                    const orderCommentMedia = this.createMediaAssociation(mediaItem.id);
                    this.orderComment.media.add(orderCommentMedia);
                }
            });
        },

        isExistingMedia(mediaItem) {
            return this.orderComment.media.some(({ id, mediaId }) => {
                return id === mediaItem.id || mediaId === mediaItem.id;
            });
        },
    },
});
