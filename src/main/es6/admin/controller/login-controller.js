export default{
    name: "loginController",
    def: ['$log', '$scope', '$stateParams', '$state', 'authedRemoteService', 'adminSettingsService', function ($log, $scope, $stateParams, $state, aRemoteService, adminSettingsService) {


        adminSettingsService.loadNoAuth().then( (result) => {
            if(adminSettingsService.isConfigured()){
                $log.info("Admin settings is configured");
                $scope.loginUrl = adminSettingsService.getLoginLink();
                $scope.canShowLogin = true;
            } else {
                $scope.needsWizard = true;
            }
            $scope.$digest();
        }).catch( (err) => {
            $log.warn("Could not retrieve Admin Settings");
            $log.warn(err);
            $scope.needsWizard = true;
            $scope.$digest();
        })

    }]
}