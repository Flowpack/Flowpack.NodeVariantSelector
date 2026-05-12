<?php

declare(strict_types=1);

namespace Flowpack\NodeVariantSelector\DataSource;

use Neos\ContentRepository\Core\DimensionSpace\DimensionSpacePoint;
use Neos\ContentRepository\Core\DimensionSpace\OriginDimensionSpacePoint;
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
     * Returns ALL dimension space points for the content repository, each annotated with its
     * variant status relative to the given node's aggregate:
     *
     *   - "occupied"    – the node aggregate has a direct variant in this DSP
     *   - "shineThrough"– the node is visible here via dimension fallback (covered but not occupied)
     *   - "missing"     – the node does not exist / is not visible in this DSP at all
     *
     * This allows the frontend to display the full picture and let editors jump to any DSP
     * or create a new variant where one is missing.
     *
     * This can be removed when `\Neos\Neos\Ui\Controller\BackendServiceController::getAdditionalNodeMetadataAction`
     * provides the necessary metadata again in the Neos 9 UI.
     *
     * @param Node|null $node The currently focused node
     * @param array<mixed> $arguments Additional arguments (unused)
     * @return list<array{coordinates: array<string,string>, status: string}> One entry per DSP
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

        $allDimensionSpacePoints = $contentRepository->getVariationGraph()->getDimensionSpacePoints();

        $variants = [];
        foreach ($allDimensionSpacePoints as $dimensionSpacePoint) {
            $originDsp = OriginDimensionSpacePoint::fromDimensionSpacePoint($dimensionSpacePoint);
            if ($nodeAggregate->occupiedDimensionSpacePoints->contains($originDsp)) {
                $status = 'occupied';
            } elseif ($nodeAggregate->coveredDimensionSpacePoints->contains($dimensionSpacePoint)) {
                $status = 'shineThrough';
            } else {
                $status = 'missing';
            }

            $variants[] = [
                'coordinates' => $dimensionSpacePoint->coordinates,
                'status' => $status,
            ];
        }

        return $variants;
    }
}
