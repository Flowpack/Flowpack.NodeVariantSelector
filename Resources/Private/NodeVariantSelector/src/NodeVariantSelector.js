import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {$get} from 'plow-js';

import {Headline, Icon, SelectBox} from '@neos-project/react-ui-components';

import I18n from '@neos-project/neos-ui-i18n';

import {actions, selectors} from '@neos-project/neos-ui-redux-store';
import {neos} from '@neos-project/neos-ui-decorators';

@neos(globalRegistry => ({
    nodeTypesRegistry: globalRegistry.get('@neos-project/neos-ui-contentrepository'),
    i18nRegistry: globalRegistry.get('i18n')
}))
@connect(state => {
    return {
        focusedNode: selectors.CR.Nodes.focusedSelector(state),
        focusedNodeParentLine: selectors.CR.Nodes.focusedNodeParentLineSelector(state),
        contentDimensions: $get('cr.contentDimensions.byName', state)
    };
}, {
    focusNode: actions.CR.Nodes.focus,
    selectPreset: actions.CR.ContentDimensions.selectPreset
})
export default class SelectedElement extends PureComponent {
    static propTypes = {
        focusedNode: PropTypes.object.isRequired,
        focusedNodeParentLine: PropTypes.object.isRequired,
        nodeTypesRegistry: PropTypes.object.isRequired
    };

    handleSelectNode = selectedNodeContextPath => {
        const {focusNode, focusedNode} = this.props;

        if (selectedNodeContextPath && selectedNodeContextPath !== $get('contextPath', focusedNode)) {
            focusNode(selectedNodeContextPath);
        }
    };

    createNodeOption = node => {
        const {nodeTypesRegistry} = this.props;
        const nodeType = $get('nodeType', node);

        return {
            icon: $get('ui.icon', nodeTypesRegistry.get(nodeType)),
            label: $get('label', node),
            value: $get('contextPath', node)
        };
    }

    render() {
        const {focusedNode, contentDimensions, i18nRegistry} = this.props;
        const focusedNodeVariants = $get('otherNodeVariants', focusedNode);
        if (!focusedNodeVariants) {
            return null;
        }

        const currentVariant = {
            value: $get('dimensions', focusedNode),
            label: (
                <div>
                    {$get('matchesCurrentDimensions', focusedNode) ? (
                        <Icon title={i18nRegistry.translate('Flowpack.NodeVariantSelector:Main:matchingTooltip')} icon="check-circle" padded="right" color="primaryBlue" />
                    ) : (
                        <Icon title={i18nRegistry.translate('Flowpack.NodeVariantSelector:Main:shinethroughTooltip')} icon="exclamation-circle" padded="right" color="warn" />
                    )}
                    {Object.keys(contentDimensions).map((dimensionName) => {
                        const dimensionValue = contentDimensions[dimensionName];
                        const dimensionPresetId = $get(['dimensions', dimensionName], focusedNode);
                        const presetLabel = $get([dimensionName, 'presets', dimensionPresetId, 'label'], contentDimensions);
                        return (<span key={dimensionName} style={{marginRight: 20, fontWeight: 'bold'}}>
                            <Icon title={i18nRegistry.translate($get('label', dimensionValue))} icon={$get('icon', dimensionValue)} padded="right" />
                            <I18n id={presetLabel} />
                        </span>);
                    })}
                </div>
            )
        };
        const otherVariants = focusedNodeVariants.map(nodeVariant => {
            return {
                value: nodeVariant,
                label: (
                    <div>
                        {Object.keys(contentDimensions).map((dimensionName) => {
                            const dimensionValue = contentDimensions[dimensionName];
                            const dimensionPresetId = $get(dimensionName, nodeVariant);
                            const presetLabel = $get([dimensionName, 'presets', dimensionPresetId, 'label'], contentDimensions);
                            return (<span key={dimensionName} style={{marginRight: 20}}>
                                <Icon icon={$get('icon', dimensionValue)} padded="right" />
                                <I18n id={presetLabel} />
                            </span>);
                        })}
                    </div>
                )
            };
        });
        const nodeVariantOptions = [currentVariant, ...otherVariants];

        return (
            <SelectBox
                id="__neos__nodeVariantsSelector"
                options={nodeVariantOptions}
                value={$get([0, 'value'], nodeVariantOptions)}
                onValueChange={preset => this.props.selectPreset(preset)}
            />
        );
    }
}
