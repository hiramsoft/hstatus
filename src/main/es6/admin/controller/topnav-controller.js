export default{
    name: "topnavController",
    def: ['$log', '$scope', '$rootScope', '$stateParams', '$state', 'adminSettingsService', function ($log, $scope, $rootScope, $stateParams, $state, adminSettingsService) {

        adminSettingsService.load().then( (result) => {
            $scope.publicSiteUrl = adminSettingsService.getPublicSite();
            $scope.$digest();
        });

        $rootScope.$on('$publicUrl', function(e, msg){
            $scope.publicSiteUrl = adminSettingsService.getPublicSite();
            $scope.$digest();
        });

        $scope.notifications = [];

        var success_timer = 5 * 1000;
        var error_timer = 30 * 1000; // 30 seconds

        var id = 0;

        $rootScope.$on('$success', function(e, msg){
            $scope.add('success', msg, success_timer);
        });

        $rootScope.$on('$error', function(e, msg){
            $log.info("$error = ", msg);
            $scope.add('error', msg, error_timer);
        });

        $rootScope.$on('$warn', function(e, msg){
            $scope.add('warn', msg, error_timer);
        });

        $rootScope.$on('$info', function(e, msg){
            $scope.add('info', msg, error_timer);
        });

        //rex = Rest Exception (i.e. a json error response)
        $rootScope.$on('$rex', function(e, obj){
            var msg = "";
            if(obj && obj.data && obj.data.message){
                msg = obj.data.message;
                $log.info("$rex = ", obj.data.message);
            }
            else if (obj.message){
                msg = obj.message;
                if(obj.code == "ExpiredToken"){
                    $scope.showLogin = true;
                }
            }
            else {
                msg = obj;
            }
            $scope.add('error', msg, error_timer);
        });

        $scope.add = function(level, message, timer){
            var notification = {level: level, message: message, id : id++};
            $scope.notifications.push(notification);
            //$timeout(function () {
            //    $scope.remove(notification);
            //}, timer);
            $scope.$digest();
        };

        $scope.remove = function(n){
            var index = $scope.notifications.indexOf(n);
            $scope.notifications.splice(index, 1);
        };

    }]
}