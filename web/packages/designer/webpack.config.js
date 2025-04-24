const webpack = require('webpack'),
    path = require('path'),
    fs = require('fs'),
    MiniCssExtractPlugin = require("mini-css-extract-plugin"),
    AfterBuildPlugin = require('@fiverr/afterbuild-webpack-plugin'),
    JavaScriptObfuscator = require("webpack-obfuscator");

const LibName = "RadDesignComponents";

function copyToResources() {
    const generatedResourceDir = path.resolve(__dirname, '../..', 'build/generated-resources/mounted/');
    const toCopy = path.resolve(__dirname, "dist/", `${LibName}.js`);
    const resourcePath = path.resolve(generatedResourceDir, `${LibName}.js`);

    if (!fs.existsSync(generatedResourceDir)) {
        fs.mkdirSync(generatedResourceDir, { recursive: true });
    }

    try {
        console.log(`Copying ${toCopy} to ${resourcePath}...`);
        fs.access(toCopy, fs.constants.R_OK, (err) => {
            if (!err) {
                fs.createReadStream(toCopy)
                    .pipe(fs.createWriteStream(resourcePath));
            } else {
                console.log(`Error when attempting to copy ${toCopy} into ${resourcePath}`);
            }
        });
    } catch (err) {
        console.log(err);
    }
}

const config = {
    mode: "production",
    entry: {
        [LibName]: path.join(__dirname, "./typescript/rad-designer-components.ts")
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
        extensions: [".jsx", ".js", ".ts", ".tsx", ".d.ts", ".css", ".scss"],
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
                exclude: /node_modules/
            },
            {
                test: /\.css$|\.scss$/,
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
                    "sass-loader"
                ]
            }
        ]
    },
    plugins: [
        new AfterBuildPlugin(() => copyToResources()),
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
        "@inductiveautomation/perspective-client": "PerspectiveClient",
        "@inductiveautomation/perspective-designer": "PerspectiveDesigner"
    }
};

module.exports = () => config;