import manifest from '@neos-project/neos-ui-extensibility';
import NodeVariantSelector from './NodeVariantSelector';

manifest('Flowpack.NodeVariantSelector:NodeVariantSelector', {}, globalRegistry => {
    const viewsRegistry = globalRegistry.get('inspector').get('views');
    viewsRegistry.set('Flowpack.NodeVariantSelector/Views/NodeVariantSelector', {
        component: NodeVariantSelector
    });
});
