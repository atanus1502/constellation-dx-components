import styled, { css } from 'styled-components';
import { defaultThemeProp } from '@pega/cosmos-react-core';

const HEIGHTS = {
  small: '20rem',
  medium: '30rem',
  large: '45rem'
} as const;

const StyledScrollArea = styled.div<{ $listHeight: keyof typeof HEIGHTS }>(
  ({ $listHeight, theme }) => {
    return css`
      max-height: ${HEIGHTS[$listHeight] ?? HEIGHTS.medium};
      overflow-y: auto;
      overscroll-behavior: contain;

      &:focus-visible {
        outline: 0.0625rem solid ${theme.base.palette.interactive};
      }
    `;
  }
);

StyledScrollArea.defaultProps = defaultThemeProp;

export const StyledFooter = styled.div(({ theme }) => {
  return css`
    display: flex;
    justify-content: center;
    padding: ${theme.base.spacing} 0;
  `;
});

StyledFooter.defaultProps = defaultThemeProp;

export default StyledScrollArea;
