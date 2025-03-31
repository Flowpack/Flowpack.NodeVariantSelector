import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {Icon, SelectBox} from '@neos-project/react-ui-components';

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
        contentDimensions: state.cr.contentDimensions.byName
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

        if (selectedNodeContextPath && selectedNodeContextPath !== focusedNode.contextPath) {
            focusNode(selectedNodeContextPath);
        }
    };

    createNodeOption = node => {
        const {nodeTypesRegistry} = this.props;
        const nodeType = node.nodeType;

        return {
            icon: nodeTypesRegistry.get(nodeType).ui.icon,
            label: node.label,
            value: node.contextPath
        };
    }

    render() {
        const {focusedNode, contentDimensions, i18nRegistry} = this.props;
        const focusedNodeVariants = focusedNode.otherNodeVariants;
        if (!focusedNodeVariants) {
            return null;
        }

        const currentVariant = {
            value: focusedNode?.dimensions,
            label: (
                <div>
                    {focusedNode.matchesCurrentDimensions ? (
                        <Icon
                            title={i18nRegistry.translate('Flowpack.NodeVariantSelector:Main:matchingTooltip')}
                            icon="check-circle"
                            padded="right"
                            color="primaryBlue"
                        />
                    ) : (
                        <Icon
                            title={i18nRegistry.translate('Flowpack.NodeVariantSelector:Main:shinethroughTooltip')}
                            icon="exclamation-circle"
                            padded="right"
                            color="warn"
                        />
                    )}
                    {Object.keys(contentDimensions).map((dimensionName) => {
                        const dimensionValue = contentDimensions[dimensionName];
                        const dimensionPresetId = focusedNode?.dimensions[dimensionName];
                        const presetLabel = contentDimensions[dimensionName].presets[dimensionPresetId]?.label;
                        return (
                            <span key={dimensionName} style={{marginRight: 20, fontWeight: 'bold'}}>
                                <Icon
                                    title={i18nRegistry.translate(dimensionValue.label)}
                                    icon={dimensionValue.icon}
                                    padded="right"
                                />
                                <I18n id={presetLabel} />
                            </span>
                        );
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
                            const dimensionPresetId = nodeVariant[dimensionName];
                            const presetLabel = dimensionValue.presets[dimensionPresetId]?.label;
                            return (
                                <span key={dimensionName} style={{marginRight: 20}}>
                                    <Icon icon={dimensionValue.icon} padded="right" />
                                    <I18n id={presetLabel} />
                                </span>
                            );
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
                value={nodeVariantOptions[0].value}
                onValueChange={preset => this.props.selectPreset(preset)}
            />
        );
    }
}
