const Apify = require('apify');

const { defaultFileNameFunction } = require('./default-functions');
const { DEFAULT_BATCH_SIZE, DEFAULT_REQUEST_EXTERNAL_TIMEOUT } = require('./constants');
const { setS3 } = require('./utils');

module.exports.constantsFromInput = async (input) => {
    // Small hack to automatically load from webhook (no need for payload template)
    const datasetId = input.datasetId || input.resource.defaultDatasetId;

    const {
        // main
        pathToImageUrls = '',
        fileNameFunction = defaultFileNameFunction,
        // Input/ouput options
        limit,
        offset,
        outputTo,
        storeInput,
        // Image upload options
        uploadTo,
        uploadStoreName,
        s3Bucket,
        s3AccessKeyId,
        s3SecretAccessKey,
        s3CheckIfAlreadyThere,
        zip = false,
        zipFilename = 'archive',
        // Transforming functions
        preDownloadFunction,
        postDownloadFunction,
        // Image check
        imageCheckType = 'content-type',
        imageCheckMinSize,
        imageCheckMinWidth,
        imageCheckMinHeight,
        imageCheckMaxRetries = 1,
        // Misc
        proxyConfiguration,
        maxConcurrency,
        stateFields,
        downloadTimeout = DEFAULT_REQUEST_EXTERNAL_TIMEOUT,
        batchSize = DEFAULT_BATCH_SIZE,
        convertWebpToPng,
        noDownloadRun = false,
    } = input;

    const imageCheck = {
        type: imageCheckType,
        minSize: imageCheckMinSize,
        minWidth: imageCheckMinWidth,
        minHeight: imageCheckMinHeight,
        convertWebpToPng,
    };
    const s3Credentials = { s3Bucket, s3AccessKeyId, s3SecretAccessKey };
    const uploadOptions = {
        uploadTo,
        s3Client: uploadTo === 's3' ? setS3(s3Credentials) : null,
        storeHandle: uploadStoreName ? await Apify.openKeyValueStore(uploadStoreName) : null,
        zip,
    };
    const downloadOptions = {
        downloadTimeout,
        maxRetries: imageCheckMaxRetries,
        proxyConfiguration,
    };
    const downloadUploadOptions = { downloadOptions, uploadOptions };

    const finalInput = {
        mainInput: {
            datasetId,
            limit,
            offset,
            storeInput,
            batchSize,
        },
        iterationInput: {
            uploadTo,
            pathToImageUrls,
            outputTo,
            fileNameFunction,
            preDownloadFunction,
            postDownloadFunction,
            maxConcurrency,
            s3CheckIfAlreadyThere,
            convertWebpToPng,
            batchSize,
            imageCheck,
            downloadUploadOptions,
            stateFields,
            noDownloadRun,
            zip,
            zipFilename,
        },
    };
    return finalInput;
};

module.exports.checkInput = (input) => {
    // Small hack to automatically load from webhook (no need for payload template)
    const datasetId = input.datasetId || input.resource.defaultDatasetId;

    if (!input.uploadTo) throw new Error('INPUT.uploadTo has to be specified!');

    if (input.uploadTo === 's3' && (!input.s3Bucket || !input.s3AccessKeyId || !input.s3SecretAccessKey)) {
        throw new Error('If you want to upload to S3, you have to provide all of s3Bucket, s3AccessKeyId and s3SecretAccessKey in input!');
    }

    if (!datasetId && !input.storeInput) {
        throw new Error('"datasetId or storeInput missing from the input!!!"');
    }

    if (datasetId && datasetId.length !== 17) {
        throw new Error('datasetId has to be a string with 17 characters! Check if you copied it correctly.');
    }

    // Should have format storeId-recordKey
    if (input.storeInput) {
        const split = input.storeInput.split('-');
        if (split.length < 2 || split[0].length !== 17) {
            throw new Error('storeInput has wrong format! It should be storeId and recordKey joined with a hyphen!');
        }
    }

    if (typeof input.fileNameFunction === 'string') {
        try {
            input.fileNameFunction = eval(input.fileNameFunction); // eslint-disable-line
        } catch (e) {
            throw new Error('fileName function cannot be evaluated as a function. Error:', e.message);
        }
    }

    if (typeof input.preDownloadFunction === 'string') {
        try {
            input.preDownloadFunction = eval(input.preDownloadFunction); // eslint-disable-line
        } catch (e) {
            throw new Error('preDownloadFunction function cannot be evaluated as a function. Error:', e.message);
        }
    }

    if (typeof input.postDownloadFunction === 'string') {
        try {
            input.postDownloadFunction = eval(input.postDownloadFunction); // eslint-disable-line
        } catch (e) {
            throw new Error('postDownloadFunction function cannot be evaluated as a function. Error:', e.message);
        }
    }

    if (!input.pathToImageUrls) {
        console.log('Path to image Urls not specified, will assume that input is plain image Urls array');
    }
    return input;
};
