// These are defined in the Hiram Pages Bridge documentation
const Q_PARAM_BRIDGE_PAGE = "x-hp-bridgepage";
const Q_PARAM_ROLE = "x-hp-role";
const Q_PARAM_EMAIL = "x-email";
const Q_PARAM_USERID = "x-userId";
const Q_PARAM_EXTRA = "x-hp-extra";
const Q_PARAM_SESSION_ID = "x-sessionId";
const Q_PARAM_EMAIL_SHA1 = "x-emailsha1";
const Q_PARAM_AUTH_SOURCE = "x-authsource";
const Q_PARAM_AWSAccessKeyId = "AWSAccessKeyId";
const Q_PARAM_AWSSessionToken = "x-amz-security-token";
const Q_PARAM_AWSSecretAccessKey = "AWSSecretAccessKey";
const Q_PARAM_AWSRegionId = "AWSRegionId";
const Q_PARAM_AWSBucket = "AWSBucket";
const Q_PARAM_AWSExpires = "Expires";

/**
 * Convenience wrapper to pull out query parameters from URL
 */
class ParamService {
    static getParameterByName(name, nullMe){
        let emptyResult = nullMe ? null : "";
        let normalizedName = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + normalizedName + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null ? emptyResult : decodeURIComponent(results[1].replace(/\+/g, " "));
    };

    static isLocalhost(){
        let location = window.location.href;
        if(location && location.indexOf("localhost") > 0){
            return true;
        } else {
            return false;
        }
    }
}

/**
 * Wraps the S3 service for basic CRUD operations on **Objects** using the credentials provided by Hiram Pages.
 *
 * Principles:
 * - Standalone -- all dependencies other than the AWS JavaScript SDK must be in this file
 * - Promise-based
 * - Strings -- input and output are strings, this class is for rest or html files
 *
 * AWS SDK docs are at http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html
 */
class AuthedRemoteService {
    constructor(){
        this.s3 = new AWS.S3(); // avoid null pointers
        this._isAwsConfigured = false;
        this.configureAwsFromParams();
    }

    /**
     * For Angular DI
     */
    static factory(){
        return new AuthedRemoteService();
    }

    // Region: User-specific parameters

    getHPRole(){
        return ParamService.getParameterByName(Q_PARAM_ROLE, true);
    }

    getHPEmail(){
        return ParamService.getParameterByName(Q_PARAM_EMAIL, true);
    }

    getHPEmailSha1(){
        return ParamService.getParameterByName(Q_PARAM_EMAIL_SHA1, true);
    }

    getHPExtra(){
        return ParamService.getParameterByName(Q_PARAM_EXTRA, true);
    }

    getHPSessionId(){
        return ParamService.getParameterByName(Q_PARAM_SESSION_ID, true);
    }

    getHPUserId(){
        return ParamService.getParameterByName(Q_PARAM_USERID, true);
    }

    getHPAuthSource(){
        return ParamService.getParameterByName(Q_PARAM_AUTH_SOURCE, true);
    }

    // Region: AWS

    configureAwsFromParams(){
        // want this to fire before any routes
        let awsAccessKeyId = ParamService.getParameterByName(Q_PARAM_AWSAccessKeyId, true);
        let awsSessionToken = ParamService.getParameterByName(Q_PARAM_AWSSessionToken, true);
        let awsSecretAccessKey = ParamService.getParameterByName(Q_PARAM_AWSSecretAccessKey, true);
        let awsRegionId = ParamService.getParameterByName(Q_PARAM_AWSRegionId, true);
        let awsBucket = ParamService.getParameterByName(Q_PARAM_AWSBucket, true);
        let awsExpires = ParamService.getParameterByName(Q_PARAM_AWSExpires, true);

        if(awsAccessKeyId == null || awsSessionToken == null || awsSecretAccessKey == null || awsRegionId == null || awsBucket == null){
            // do nothing
        } else {
            this.acceptCreds(awsBucket, awsRegionId, awsExpires, awsAccessKeyId, awsSecretAccessKey, awsSessionToken);
        }
    }

    isAwsConfigured(){
        return this._isAwsConfigured;
    }

    acceptCreds(bucket, region, expires, accessKeyId, secretAccessKey, sessionToken){
        this.bucket = bucket;
        this.region = region;
        this.expires = Number(expires) || new Date().getUTCSeconds() + 3600;
        this.awsAccessKeyId = accessKeyId;
        this.awsSecretAccessKey = secretAccessKey;
        this.awsSessionToken = sessionToken;

        this.config = new AWS.Config({
            accessKeyId: this.awsAccessKeyId,
            secretAccessKey: this.awsSecretAccessKey,
            sessionToken : this.awsSessionToken,
            region: this.region
        });

        AWS.config = this.config;

        this.s3 = new AWS.S3();
        this._isAwsConfigured = true;
    }

    getS3(){
        return this.s3;
    }

    getAwsConfig(){
        return this.config;
    }

    get(key){
        return new Promise( (resolve, reject) => {
            var params = {
                // Works around iOS bug https://github.com/aws/aws-sdk-js/issues/376
                ResponseCacheControl: 'no-cache',
                ResponseExpires: new Date(0),
                // request content
                Bucket: this.bucket,
                Key: key
            };
            try {
                this.s3.getObject(params, (err, data) => {
                    if (err) {
                        reject({
                            code: err.code,
                            message : err.message
                        });
                    } else {
                        resolve(data.Body.toString());
                    }
                });
            } catch(e){
                reject(e);
            }
        });
    }

    set(key, data, contentType){
        console.log("Asked to set to s3", key, data);
        return new Promise( (resolve, reject) => {
            var params = {
                Bucket: this.bucket, /* required */
                Key: key, /* required */
                Body: data,
                ContentType: contentType || 'application/json',
                ContentLength: data.length
            };
            try {
                this.s3.putObject(params, (err, data) => {
                    if (err) {
                        reject({
                            code: err.code,
                            message: err.message
                        });
                    }
                    else {
                        resolve(data);
                    }
                });
            }
            catch(e) {
                reject(e);
            }
        });
    }

    delete(key){
        return new Promise( (resolve, reject) => {
           var params = {
               Bucket: this.bucket, /* required */
               Key: key /* required */
           }
            try {
                this.s3.deleteObject(params, (err, data) => {
                    if(err){
                        reject({
                            code: err.code,
                            message: err.message
                        });
                    }
                    else {
                        resolve(data);
                    }
                });
            }
            catch (e){
                reject(e);
            }
        });
    }


}

AuthedRemoteService.factory.$inject = [];

export default AuthedRemoteService;