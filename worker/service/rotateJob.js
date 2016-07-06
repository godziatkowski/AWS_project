var async = require( 'async' ),
        AWS = require( "./aws" ),
        config = require( './../config/config.json' ),
        fs = require( 'fs' ),
        lwip = require( 'lwip' ),
        randomstring = require( "randomstring" );

exports.create = create;


function create( sqsMessage ){
    return function( callback ){
        deleteMessage( sqsMessage, function( err, data ){
            if( err ){
                callback( err );
                return;
            }

            var taskParams = JSON.parse( sqsMessage.Body );

            rotate( taskParams.file, taskParams.angle )
                    .then( callback, callback );
        } );
    };
}

function deleteMessage( message, callback ){
    var params = {
        QueueUrl: config.queueUrl,
        ReceiptHandle: message.ReceiptHandle
    };

    AWS.getSqs().deleteMessage( params, callback );
}

function rotate( fileName, angle ){
    return new Promise( function( resolve, reject ){
        var fileData = {
            Bucket: config.bucket,
            Key: fileName
        };

        AWS.getS3().getObject( fileData, function( err, data ){
            if( err ){
                reject( err );
                return;
            }

            var fileType = getFileTypeFromName( fileName );

            lwip.open( data.Body, fileType, function( err, image ){
                image.rotate( angle, 'white', function( err, image ){
                    image.toBuffer( fileType, function( err, buffer ){
                        var params = {
                            Bucket: config.bucket,
                            Key: fileName,
                            Body: buffer,
                            ACL: 'public-read'
                        };

                        AWS.getS3().upload( params, function( err, data ){
                            if( err ){
                                reject( err );
                            } else{
                                logJobSuccess( fileName, angle )
                                        .then( resolve, reject );
                            }
                        } );
                    } );
                } );
            } );
        } );
    } );
}

function getFileTypeFromName( filename ){
    var extension = filename.split( '.' );
    extension = extension[extension.length - 1].toLowerCase();

    if( extension === 'jpg' || extension === 'jpeg' ){
        return 'jpg';
    }

    return extension;
}

function logJobSuccess( fileName, angle ){
    return new Promise( function( resolve, reject ){
        var params = {
            Attributes: [{
                    Name: 'type',
                    Value: 'rotate',
                    Replace: false
                }, {
                    Name: 'fileName',
                    Value: fileName,
                    Replace: false
                }, {
                    Name: 'angle',
                    Value: angle + '',
                    Replace: false
                }, {
                    Name: 'date',
                    Value: ( new Date() ).toISOString(),
                    Replace: false
                }],
            DomainName: config.simpleDb.jobs,
            ItemName: randomstring.generate( 10 )
        };

        AWS.getSimpleDb().putAttributes( params, function( err ){
            if( err ){
                reject( err );
            } else{
                resolve();
            }
        } );
    } );
}
