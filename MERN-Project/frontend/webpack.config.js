const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');
const fs = require('fs');

module.exports = (env, argv) => {
  // Determine the environment
  const mode = argv.mode || 'development';
  const isProduction = mode === 'production';
  
  // Load the appropriate .env file based on environment
  const envFile = env && env.production ? '.env.production' 
    : env && env.staging ? '.env.staging' 
    : '.env';
  
  // Try to load environment variables from file
  let envConfig = {};
  try {
    if (fs.existsSync(envFile)) {
      envConfig = dotenv.config({ path: envFile }).parsed || {};
      console.log(`Loaded environment variables from ${envFile}`);
    } else {
      console.log(`Environment file ${envFile} not found, using defaults`);
    }
  } catch (error) {
    console.warn(`Error loading environment variables: ${error.message}`);
  }
  
  // Create environment variables to pass to the React app
  const envKeys = Object.keys(envConfig).reduce((prev, next) => {
    prev[`process.env.${next}`] = JSON.stringify(envConfig[next]);
    return prev;
  }, {});
  
  // Always include API URL based on environment
  envKeys['process.env.REACT_APP_API_URL'] = JSON.stringify(
    env && env.production ? 'https://api.careerlabs.com' 
      : env && env.staging ? 'https://api-staging.careerlabs.com' 
      : 'http://localhost:5000'
  );
  
  // Add NODE_ENV
  envKeys['process.env.NODE_ENV'] = JSON.stringify(mode);
  
  const config = {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: isProduction 
        ? 'static/js/[name].[contenthash:8].js'
        : 'static/js/bundle.js',
      chunkFilename: isProduction 
        ? 'static/js/[name].[contenthash:8].chunk.js'
        : 'static/js/[name].chunk.js',
      publicPath: '/',
      clean: true,
    },
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@context': path.resolve(__dirname, 'src/context'),
        '@assets': path.resolve(__dirname, 'src/assets'),
      },
      fallback: {
        "path": false,
        "fs": false,
        "os": false,
      }
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                ['@babel/preset-react', { runtime: 'automatic' }],
              ],
              cacheDirectory: true,
            },
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif|ico)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'static/media/[name].[hash:8][ext]',
          },
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'static/fonts/[name].[hash:8][ext]',
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        inject: true,
        ...(isProduction && {
          minify: {
            removeComments: true,
            collapseWhitespace: true,
            removeRedundantAttributes: true,
            useShortDoctype: true,
            removeEmptyAttributes: true,
            removeStyleLinkTypeAttributes: true,
            keepClosingSlash: true,
            minifyJS: true,
            minifyCSS: true,
            minifyURLs: true,
          },
        }),
      }),
      new webpack.DefinePlugin(envKeys),
    ],
    devServer: {
      static: { directory: path.join(__dirname, 'public') },
      port: 3000,
      hot: true,
      historyApiFallback: true,
      proxy: [
        {
          context: ['/api'],
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false
        }
      ],
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
      },
    },
    stats: {
      errorDetails: true,
    },
  };
  
  if (isProduction) {
    // Add optimization for production
    config.optimization = {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            parse: { ecma: 8 },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
            },
            mangle: { safari10: true },
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true,
            },
          },
          parallel: true,
        }),
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
      runtimeChunk: 'single',
    };
    
    // Only add analyze if explicitly requested through environment
    if (process.env.ANALYZE) {
      console.log('Bundle analysis requested but webpack-bundle-analyzer is not installed.');
      console.log('Install it with: npm install --save-dev webpack-bundle-analyzer');
    }
  } else {
    // Development specific configuration
    config.devtool = 'eval-source-map';
  }
  
  return config;
}; 