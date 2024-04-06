<?php

declare(strict_types=1);

namespace SptecOrderComments\Extension\Checkout\Order\OrderComment;

use Shopware\Core\Checkout\Order\OrderDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\EntityDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\Field\BoolField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\FkField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\ApiAware;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\CascadeDelete;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\PrimaryKey;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\Required;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\SearchRanking;
use Shopware\Core\Framework\DataAbstractionLayer\Field\IdField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\LongTextField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\ManyToOneAssociationField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\OneToManyAssociationField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\ReferenceVersionField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\VersionField;
use Shopware\Core\Framework\DataAbstractionLayer\FieldCollection;
use Shopware\Core\System\User\UserDefinition;

class OrderCommentDefinition extends EntityDefinition
{
    final public const string ENTITY_NAME = 'sptec_order_comment';

    final public const string EXTENSION_NAME = 'sptecOrderComments';

    #[\Override]
    public function getEntityName(): string
    {
        return self::ENTITY_NAME;
    }

    #[\Override]
    public function getEntityClass(): string
    {
        return OrderCommentEntity::class;
    }

    #[\Override]
    public function getCollectionClass(): string
    {
        return OrderCommentCollection::class;
    }

    #[\Override]
    protected function defineFields(): FieldCollection
    {
        return new FieldCollection([
            (new IdField('id', 'id'))->addFlags(new ApiAware(), new PrimaryKey(), new Required()),
            (new VersionField())->addFlags(new ApiAware()),

            (new FkField('order_id', 'orderId', OrderDefinition::class))->addFlags(new ApiAware(), new Required()),
            (new ReferenceVersionField(OrderDefinition::class))->addFlags(new ApiAware(), new Required()),

            (new FkField('created_by_id', 'createdById', UserDefinition::class, 'id'))->addFlags(new Required()),

            (new LongTextField('content', 'content'))->addFlags(new ApiAware(), new Required(), new SearchRanking(SearchRanking::HIGH_SEARCH_RANKING)),
            (new BoolField('internal', 'internal'))->addFlags(new ApiAware(), new Required()),
            (new BoolField('task', 'task'))->addFlags(new ApiAware()),

            (new ManyToOneAssociationField('order', 'order_id', OrderDefinition::class, 'id', false))->addFlags(new ApiAware()),
            (new ManyToOneAssociationField('createdBy', 'created_by_id', UserDefinition::class, 'id', false))->addFlags(new ApiAware(), new SearchRanking(SearchRanking::ASSOCIATION_SEARCH_RANKING)),

            (new OneToManyAssociationField('media', OrderCommentMediaDefinition::class, 'order_comment_id'))->addFlags(new ApiAware(), new CascadeDelete()),
        ]);
    }
}
