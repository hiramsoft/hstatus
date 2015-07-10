hStatus - Open Source Static Status Page
=================

[hStatus](https://www.hstatus.com) is an open source status page designed to be hosted on AWS S3 as a static site.
It requires no servers to operate, and when combined with your favorite CDN, you should be able to host a highly
available status site for minimal cost.

Together with [Hiram Pages](https://www.hirampages.com), you may update incidents using only a web browser.

Demo
-----

A live demo with sample data is at [https://status.hstatus.com](htts://status.hstatus.com)

Other [Hiram Software](https://www.hiramsoftware.com) projects like
[Hiram Pages](https://status.hirampages.com)
and
[Monday Wire](https://status.mondaywire.com)
have used hStatus for some time.

Features
------

All the benefits of...

1. A static website -- no servers to cause downtime or security incidents
2. AWS S3 -- complete control of your data, highly available, and inexpensive
3. Open source -- fork and modify to suit your needs
4. Hiram Pages -- log in to update your incidents
5. Markdown-formatted posts

With a few drawbacks...

1. Realtime data graphs not yet implemented
2. Incident archive not yet implemented
3. Not a trendy VC-funded startup

Requirements
-------

1. AWS S3 Bucket configured to host a static website (see below for sample bucket policy)
    1. There are many good references available via your favorite search engine with specific instructions
2. If you would like to administer hStatus from the internet, you will need [Hiram Pages](https://www.hirampages.com)

Installation
-------

0. Create and AWS Bucket to host your status page.  Say, status.example.com
1. Download the dist package or build yourself using:
    1. > npm install
    2. > gulp dist
    3. (that's it)
2. Using your favorite method, upload the dist folder to your AWS bucket.
    1. I like to use the [AWS CLI](http://aws.amazon.com/cli/), and a pre-made script is available in ./publish.sh
    2. Configure the bucket to host a static website.  A sample policy is below for convenience.  Update your DNS to point to your bucket.
3. Then go to [Hiram Pages](https://www.hirampages.com), and configure Hiram Pages for your AWS Bucket.
4. Create an hStatus link, and click the link.
5. You now can manage your incidents.

All of your data is hosted on your AWS Bucket.
You have complete control of your status page.
Your page will only go down if AWS S3 or your DNS provider goes down.

If you choose to save your hStatus link in the settings, you will be able to log in to your hStatus page
using the `admin.html`, whose link is at the bottom of the index page.

Developing and Building
------

You need [JSPM](https://www.jspm.io), [NPM](https://www.npmjs.com/), and [Gulp](http://gulpjs.com/) to develop hStatus. 

This project is based on the [ES6 AngularJS Starter](https://www.github.com/hiramsoft/es6-ng-twbs-start), also available from Hiram Software.

0. Have your **bucket name** and **Hiram Pages Link** ready
1. git clone https://www.github.com/hiramsoft/hstatus
2. cd hstatus
3. npm install
4. jspm install
5. gulp serve
    1. Go to http://localhost:8080 to develop
6. gulp dist
    1. Minifies the JavaScript

Note: CORS will be an issue, most like, while doing development from localhost.
If this blocks you, you can disable CORS in Chrome:

    open /Applications/Google\ Chrome.app/ --args --disable-web-security
    
Obviously, you should only use this feature when developing sites that have CORS interaction issues
and not browse the internet with web security disabled!

Contributing and Filing issues
-------

Pull requests are welcome.  Two requests:

1. All contributions must be made under the GPL V3.  Please add your name to the CREDITS file to signify you agree.
2. Err on the site of troubleshooting or fixing yourself :)

Sample Bucket Policy
-------

The following is a sample policy for your bucket that allows the general public to view your status page 

      {
          "Version": "2012-10-17",
          "Statement": [
              {
                  "Sid": "StmtStaticWebsite",
                  "Effect": "Allow",
                  "Principal": "*",
                  "Action": "s3:GetObject",
                  "Resource": "arn:aws:s3:::[your-bucket-here]/*"
              }
          ]
      }


Sample Editor Policy      
-----

Hiram Pages knows how to generate a default link that lets editors manage incidents.

You want to make sure that the Role policy allows reading, writing, and listing of files
on your bucket.

Todos
=====

* Usage graphs
    * I am investigating how AWS Lambda + AWS Cloudwatch may be useful to generate usage graphs.
    * I think it's possible, and if so, this would enable you to have pretty real-time pictures
    * Would also enable calculating an SLA automatically
* Archiving old incidents
    * This is a feature that people say they want, but I've never
* Mobile layout tweaks
    * I picked default a Zurb Foundation layout, and it isn't quite right on my iPhone.
      Nothing blocking, but it could be better.