export default{
    name: "settingsController",
    def: ['$log', '$scope', '$rootScope', '$stateParams', '$state', 'authedRemoteService', 'adminSettingsService', function ($log, $scope, $rootScope, $stateParams, $state, aRemoteService, adminSettingsService) {


        $scope.getSettings = () => {
                aRemoteService.get("data/desc.json").then( (descJson) => {
                    var desc = JSON.parse(descJson);

                    $scope.settings = desc;
                    $scope.$digest();
                }).catch( (err) => {
                    $rootScope.$broadcast('$rex', err);
                    $scope.showFirstTime = true;
                    $log.warn(err);
                    $scope.$digest();
                });
        };

        $scope.saveSettings = () => {
            $scope.isSaving = true;
            $scope.isSaved = false;
            var settingsJson = JSON.stringify($scope.settings);
           aRemoteService.set("data/desc.json", settingsJson).then( (result) => {
               $scope.isSaving = false;
               $scope.isSaved = true;
               $scope.$digest();
           }).catch( (err) => {
               $rootScope.$broadcast('$rex', err);
               $log.warn(err);
               $scope.isSaving = false;
               $scope.isSaved = false;
               $scope.$digest();
           })
        };

        $scope.resetEverything = () => {

            var files = [
                "data/desc.json",
                "data/current.json",
                "data/admin-settings.json"
            ];

            for(var file of files){
                aRemoteService.set(file, "{}")
            };
        };

        $scope.getAdminSettings = () => {
            adminSettingsService.loadNoCache().then( (result) => {
                $scope.loginLink = adminSettingsService.getLoginLink();
                $scope.publicSiteUrl = adminSettingsService.getPublicSite();
                $scope.$digest();
            })
        };

        $scope.saveAdminSettings = () => {
            adminSettingsService.setLoginLink($scope.loginLink);
            adminSettingsService.setPublicSite($scope.publicSiteUrl);

            $scope.isAdminSaving = true;
            $scope.isAdminSaved = true;
            adminSettingsService.save().then((ok)=>{
                $rootScope.$broadcast('$publicUrl');
                $scope.isAdminSaving = false;
                $scope.isAdminSaved = true;
                $scope.$digest();
            }).catch( (err) => {
                $scope.isAdminSaving = false;
                $scope.isAdminSaved = false;
                $scope.$digest();
            })
        };

        $scope.getSettings();
        $scope.getAdminSettings();

    }]
}