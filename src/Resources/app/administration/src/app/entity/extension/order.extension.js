const { EntityDefinition } = Shopware;

EntityDefinition.addExtension('order', {
    sptecOrderComments: {
        type: 'one_to_many',
        relation: 'one_to_many',
        entity: 'sptec_order_comment',
        localField: 'id',
        referenceField: 'orderId',
        flags: {
            cascade_delete: true,
        },
    },
});
