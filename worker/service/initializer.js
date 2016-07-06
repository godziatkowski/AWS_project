var AWS = require( './aws' ),
        config = require( '../config/config.json' );

exports.init = function(){
    createDomain( config.simpleDb.domains.jobs );
    createDomain( config.simpleDb.domains.logs );
};

function createDomain( domainName ){
    var params = {
        DomainName: domainName
    };

    AWS.getSimpleDb().createDomain( params, function( err, data ){
        if( err ){
            console.log( 'Could not create domain <' + domainName + '>: ' + err );
        }
    } );
}