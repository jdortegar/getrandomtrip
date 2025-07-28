import { defineConfig } from 'cypress';
import webpackPreprocessor from '@cypress/webpack-preprocessor';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      const options = {
        webpackOptions: {
          resolve: {
            extensions: ['.ts', '.tsx', '.js'],
          },
          module: {
            rules: [
              {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: {
                  transpileOnly: true,
                },
              },
            ],
          },
          externals: {
            express: 'commonjs express',
            mercadopago: 'commonjs mercadopago',
            '@prisma/client': 'commonjs @prisma/client',
          },
        },
      };
      on('file:preprocessor', webpackPreprocessor(options));
    },
  },
});