<?php

declare(strict_types=1);

namespace Flowpack\NodeVariantSelector\DataSource;

use Neos\ContentRepository\Core\Feature\Security\Exception\AccessDenied;
use Neos\ContentRepository\Core\Projection\ContentGraph\Node;
use Neos\ContentRepositoryRegistry\ContentRepositoryRegistry;
use Neos\Flow\Annotations as Flow;
use Neos\Neos\Service\DataSource\AbstractDataSource;

class NodeVariantsDataSource extends AbstractDataSource
{
    /**
     * @var string
     */
    static protected $identifier = 'flowpack-nodevariantselector-variants';

    #[Flow\Inject]
    protected ContentRepositoryRegistry $contentRepositoryRegistry;

    /**
     * Returns all occupied dimension space points for the given node's aggregate,
     * so the frontend can offer switching to another dimension variant.
     *
     * This can be removed when the `\Neos\Neos\Ui\Controller\BackendServiceController::getAdditionalNodeMetadataAction`
     * provides the necessary metadata for the variants again in the UI.
     *
     * Each entry is an associative array of dimension name => dimension value,
     * e.g. ['language' => 'de']. In Neos 9 the dimension value IS the preset
     * name, so this array can be passed directly to selectPreset() on the frontend.
     *
     * @param Node|null $node The currently focused node
     * @param array<mixed> $arguments Additional arguments (unused)
     * @return list<array<string,string>> One entry per occupied dimension space point
     * @throws AccessDenied
     */
    public function getData(?Node $node = null, array $arguments = []): array
    {
        if ($node === null) {
            return [];
        }

        $contentRepository = $this->contentRepositoryRegistry->get($node->contentRepositoryId);
        $contentGraph = $contentRepository->getContentGraph($node->workspaceName);
        $nodeAggregate = $contentGraph->findNodeAggregateById($node->aggregateId);

        if ($nodeAggregate === null) {
            return [];
        }

        $variants = [];
        foreach ($nodeAggregate->occupiedDimensionSpacePoints as $occupiedDimensionSpacePoint) {
            $variants[] = $occupiedDimensionSpacePoint->coordinates;
        }

        return $variants;
    }
}
