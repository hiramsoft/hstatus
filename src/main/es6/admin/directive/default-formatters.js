import moment from 'moment';
import marked from 'marked';

var TimeFormatters = Array.from([
    {
        "name": "calendar",
        "fn": function () {
            return function (dt) {
                return moment(dt).calendar();
            };
        }
    },
    {
        "name" : "hoursOnly",
        "fn" : function() {
            return function(dt) {
                return moment(dt).format("h:mm a");
            };
        }
    },
    {
        "name" : "fromNow",
        "fn" : function() {
            return function(dt) {
                return moment(dt).fromNow()
            };
        }
    },
    {
        "name": 'daysOnly',
        "fn": () => {
            return (dt) => {
                return moment(dt).format("dddd, MMM D");
            };
        }
    },
    {
        "name" : 'fromDayOfYear',
        "fn" : () => {
            return (day) => {
                return moment().dayOfYear(day);
            };
        }
    },
    {
        "name" : 'markdown',
        "fn" : ['$sce', ($sce) => {
            return (str) => {
                return $sce.trustAsHtml(marked(str));;
            }
        }]
    }
]);

export default TimeFormatters;