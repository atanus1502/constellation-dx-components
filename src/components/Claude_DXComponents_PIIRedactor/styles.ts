// individual style, comment out above, and uncomment here and add styles
import styled, { css } from 'styled-components';
import { defaultThemeProp } from '@pega/cosmos-react-core';

const StyledPIIRedactor = styled.div(({ theme }) => {
  return css`
    margin: 0px 0;

    /* Reveal toggle — the default icon-only action button is too subtle (currentColor, 's' size) */
    button svg {
      width: 1.25rem;
      height: 1.25rem;
      color: ${theme.base.palette.interactive};
    }
  `;
});

StyledPIIRedactor.defaultProps = defaultThemeProp;

export default StyledPIIRedactor;
