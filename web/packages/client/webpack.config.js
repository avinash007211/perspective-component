/**
 * Webpack build configuration file. Configured for production build to minify and hide source code.
 */

const webpack = require('webpack'),
    path = require('path'),
    fs = require('fs'),
    MiniCssExtractPlugin = require("mini-css-extract-plugin"),
    AfterBuildPlugin = require('@fiverr/afterbuild-webpack-plugin'),
    JavaScriptObfuscator = require("webpack-obfuscator");

const LibName = "RadComponents";

function copyToResources() {
    const generatedResourcesDir = path.resolve(__dirname, '../..', 'build/generated-resources/mounted/');
    const jsToCopy = path.resolve(__dirname, "dist/", `${LibName}.js`);
    const cssToCopy = path.resolve(__dirname, "dist/", `${LibName}.css`);
    const jSResourcePath = path.resolve(generatedResourcesDir, `${LibName}.js`);
    const cssResourcePath = path.resolve(generatedResourcesDir, `${LibName}.css`);

    const toCopy = [
        { from: jsToCopy, to: jSResourcePath },
        { from: cssToCopy, to: cssResourcePath }
    ];

    if (!fs.existsSync(generatedResourcesDir)) {
        fs.mkdirSync(generatedResourcesDir, { recursive: true });
    }

    toCopy.forEach(file => {
        console.log(`Copying ${file.from} to ${file.to}...`);
        try {
            fs.access(file.from, fs.constants.R_OK, (err) => {
                if (!err) {
                    fs.createReadStream(file.from)
                        .pipe(fs.createWriteStream(file.to));
                } else {
                    console.log(`Error when copying ${file.from}: ${err}`);
                }
            });
        } catch (err) {
            console.error(err);
            throw err;
        }
    });
}

const config = {
    mode: "production",
    entry: {
        [LibName]: path.join(__dirname, "./typescript/rad-client-components.ts")
    },
    output: {
        library: [LibName],
        path: path.join(__dirname, "dist"),
        filename: `${LibName}.js`,
        libraryTarget: "umd",
        umdNamedDefine: true
    },
    devtool: false,
    resolve: {
        extensions: [".jsx", ".js", ".ts", ".tsx", ".d.ts", ".css", ".scss", ".svg"],
        modules: [
            path.resolve(__dirname, "../../node_modules")
        ]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: false
                    }
                },
                exclude: /node_modules/,
            },
            {
                test: /\.css$|.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            url: false,
                            modules: {
                                mode: 'local',
                                localIdentName: '[hash:base64:5]',
                                exportLocalsConvention: 'camelCase'
                            }
                        }
                    },
                    {
                        loader: "sass-loader"
                    }
                ]
            },
            {
                test: /\.svg$/,
                issuer: /\.[jt]sx?$/,
                use: [
                    {
                        loader: '@svgr/webpack',
                        options: {
                            svgo: true,
                            titleProp: true,
                            ref: true
                        }
                    },
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[hash].[ext]',
                            outputPath: 'assets/',
                            publicPath: 'assets/'
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new AfterBuildPlugin(function (stats) {
            copyToResources();
        }),
        new MiniCssExtractPlugin({
            filename: "[name].css"
        }),
        new JavaScriptObfuscator({
            rotateUnicodeArray: true,
            compact: true,
            controlFlowFlattening: true,
            stringArray: true,
            stringArrayEncoding: ['rc4'],
            stringArrayThreshold: 1,
            deadCodeInjection: true,
            deadCodeInjectionThreshold: 0.4
        }, [`${LibName}.js`]),
    ],
    externals: {
        "react": "React",
        "react-dom": "ReactDOM",
        "mobx": "mobx",
        "mobx-react": "mobxReact",
        "@inductiveautomation/perspective-client": "PerspectiveClient"
    },
    optimization: {
        splitChunks: {
            cacheGroups: {
                styles: {
                    name: 'styles',
                    test: /\.css$/,
                    chunks: 'all',
                    enforce: true,
                },
            },
        },
    },
};

module.exports = () => config;
