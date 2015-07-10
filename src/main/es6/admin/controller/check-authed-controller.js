export default{
    name: "checkAuthedController",
    def: ['$log', '$scope', '$stateParams', '$state', 'authedRemoteService', 'adminSettingsService', function ($log, $scope, $stateParams, $state, aRemoteService, adminSettingsService) {

        $scope.doCheck = () => {

            if (aRemoteService.isAwsConfigured()) {
                $log.info("Authenticated.  Accepting credentials and navigating to incidents controller");
                adminSettingsService.load().then( (ok) => {
                    $state.go("authed.incidents", {}, {location:false});
                }).catch( (err) => {
                    $state.go("authed.settings", {}, {location:false});
                });
            } else {
                $log.info("Do not see any Hiram Pages information, so this session is not authenticated");
                $state.go("unauthed.login", {}, {location:false});
            }
        };

        $scope.doCheck();

    }]
}