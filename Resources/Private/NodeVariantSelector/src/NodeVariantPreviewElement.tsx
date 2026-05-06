import React from 'react';

// eslint-disable-next-line camelcase
import { SelectBox_Option_MultiLineWithThumbnail } from '@neos-project/react-ui-components';

export const NodeVariantPreviewElement: React.FC<{ option: NodeVariantOption}> = ({ option, ...rest}) => {
    return <SelectBox_Option_MultiLineWithThumbnail {...rest} {...option} />;
};
