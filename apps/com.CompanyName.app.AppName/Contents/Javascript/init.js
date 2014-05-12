include("Javascript/views/MainView.js");

MAF.application.init({
    views: [
        { id: 'view-MainView', viewClass: MainView }
    ],
    defaultViewId: 'view-MainView'
});