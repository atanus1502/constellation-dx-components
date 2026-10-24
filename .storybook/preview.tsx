import type { Preview } from '@storybook/react';
import Theme from './theme';

import {
  Configuration,
  LiveLog,
  ModalManager,
  PopoverManager,
  ShortcutManager,
  Toaster
} from '@pega/cosmos-react-core';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    docs: {
      source: { type: 'code' },
      theme: Theme
    }
  },

  decorators: [
    // Sets up contexts
    (Story, context) => {
      return (
        <Configuration disableDefaultFontLoading id='Preview'>
          <ShortcutManager>
            <LiveLog maxLength={context.args.liveLogMaxLength || 50}>
              <PopoverManager>
                <Toaster dismissAfter={5000}>
                  <ModalManager>
                    <Story {...context} />
                  </ModalManager>
                </Toaster>
              </PopoverManager>
            </LiveLog>
          </ShortcutManager>
        </Configuration>
      );
    }
  ]
};

export default preview;
