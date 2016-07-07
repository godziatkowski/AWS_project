var AWS = require( 'aws-sdk' ),
//var AWS = require( '../service/aws' ),
        config = require( '../config/config.json' );

var TEMPLATE_NAME = 'index.ejs';

AWS.config.loadFromPath( './config.json' );
var s3 = new AWS.S3();

exports.action = function( request, callback ){
    var params = {
        Bucket: config.bucket
    };
    s3.listObjects( params, function( err, data ){
        if( err )
            console.log( err, err.stack ); // an error occurred
        else{
            callback( null, {
                template: TEMPLATE_NAME, params: {
                    bucket: config.bucket,
                    files: data.Contents
                }
            } );
        }
    } );
};
