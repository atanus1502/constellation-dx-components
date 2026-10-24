import styled, { css } from 'styled-components';
import { defaultThemeProp } from '@pega/cosmos-react-core';

const StyledSLADeadlineTracker = styled.div(({ theme }) => {
  return css`
    margin: 0px 0;
    padding: 1.5rem;
    background: ${theme.base.palette['app-background']};

    .sla-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-block-end: 1.5rem;
    }

    .sla-legend {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .sla-legend-item {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
    }

    .sla-legend-dot {
      width: 0.625rem;
      height: 0.625rem;
      border-radius: 50%;
      display: inline-block;
    }

    .sla-cards {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .sla-card {
      flex: 1 1 16rem;
      min-width: 16rem;
      background: ${theme.base.palette['primary-background']};
      border: 0.0625rem solid ${theme.base.palette['border-line']};
      border-radius: 0.5rem;
      padding: 1.25rem;
    }

    .sla-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.5rem;
      margin-block-end: 0.5rem;
    }

    .sla-card-body {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-block: 1rem;
    }

    .sla-card-remaining {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .sla-card-track {
      height: 0.375rem;
      border-radius: 999px;
      background: ${theme.base.palette['border-line']};
      overflow: hidden;
    }

    .sla-card-track-fill {
      height: 100%;
      border-radius: 999px;
    }

    .sla-card-track-labels {
      display: flex;
      justify-content: space-between;
      margin-block-start: 0.375rem;
    }

    .sla-summary {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
      margin-block-start: 1.5rem;
      padding: 1rem 1.25rem;
      background: ${theme.base.palette['primary-background']};
      border: 0.0625rem solid ${theme.base.palette['border-line']};
      border-radius: 0.5rem;
    }

    .sla-summary-item {
      font-weight: 600;
    }

    .sla-summary-updated {
      margin-inline-start: auto;
    }
  `;
});

StyledSLADeadlineTracker.defaultProps = defaultThemeProp;

export default StyledSLADeadlineTracker;
