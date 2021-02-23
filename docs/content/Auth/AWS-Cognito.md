---
title: AWS Cognito Guide
permalink: /security/jwt/aws-cognito
category: Authentication & Authorization
menuOrder: 2
---

## Introduction

In this guide, you'll learn how to integrate AWS Cognito authentication with a
Cube.js deployment. If you already have a pre-existing application on Auth0 that
you'd like to re-use, please skip ahead to
[Configure Cube.js to use AWS Cognito](#configure-cube-js-to-use-aws-cognito).

## Create and configure a User Pool on AWS Cognito

If you haven't already created a User Pool, please follow [the instructions in
the AWS Cognito documentation][link-aws-cognito-create-up] to create one.

After creating the User Pool, follow [the instructions
here][link-aws-cognito-hosted-zone] to enable the Hosted UI and to create an App
Client.

[link-aws-cognito-create-up]:
  https://docs.aws.amazon.com/cognito/latest/developerguide/getting-started-with-cognito-user-pools.html
[link-aws-cognito-hosted-zone]:
  https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-integration.html#cognito-user-pools-create-an-app-integration

### Custom claims

To add custom claims to the JWT, you will need to associate [a Lambda
function][link-aws-lambda] to the [Pre Token Generation event
trigger][link-aws-cognito-pre-token] available on your User Pool.

Use the handler below as an example Lambda function.

```javascript
exports.handler = (event, context, callback) => {
  event.response = {
    claimsOverrideDetails: {
      claimsToAddOrOverride: {
        'http://localhost:4000/': {
          company_id: 'company1',
          user_id: event.request.userAttributes.sub,
          roles: ['user'],
        },
      },
    },
  };
  callback(null, event);
};
```

[link-aws-lambda]: https://docs.aws.amazon.com/lambda/latest/dg/welcome.html
[link-aws-cognito-pre-token]:
  https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-token-generation.html

## Configure Cube.js to use AWS Cognito

Now we're ready to configure Cube.js to use AWS Cognito. Go to your Cube.js
project and open the `.env` file and add the following, replacing the values
wrapped in `<>`.

```dotenv
CUBEJS_JWK_URL=https://cognito-idp.<AWS_REGION>.amazonaws.com/<USER_POOL_ID>/.well-known/jwks.json
CUBEJS_JWT_AUDIENCE=<APPLICATION_URL>
CUBEJS_JWT_ISSUER=https://<AUTH0-SUBDOMAIN>.auth0.com/
CUBEJS_JWT_ALGS=RS256
CUBEJS_JWT_CLAIMS_NAMESPACE=<CLAIMS_NAMESPACE>
```

## Testing with the Developer Playground

### Retrieving a JWT

Go to the [OpenID Playground from Auth0][link-openid-playground] to and click
Configuration.

<p
  style="text-align: center"
>
  <img
  src="https://raw.githubusercontent.com/statsbotco/cube.js/master/docs/content/Auth/auth0-03-get-jwt-01.png"
  style="border: none"
  width="80%"
  />
</p>
Enter the following values:

- **Auth0 domain**: `<AUTH0-SUBDOMAIN>.auth0.com`
- **OIDC Client ID**: Retrieve from Auth0 API settings page
- **OIDC Client Secret**: Retrieve from Auth0 API settings page

Click 'Use Auth0 Discovery Document' to auto-fill the remaining values, then
click Save.

<p
  style="text-align: center"
>
  <img
  src="https://raw.githubusercontent.com/statsbotco/cube.js/master/docs/content/Auth/auth0-03-get-jwt-02.png"
  style="border: none"
  width="80%"
  />
</p>
<!-- prettier-ignore-start -->
[[warning |]]
| If you haven't already, go back to the Auth0 application's settings and add
| `https://openidconnect.net/callback` to the list of allowed callback URLs.
<!-- prettier-ignore-end -->

Now click Start; if the login is successful, you should see the code, as well as
a button called 'Exchange'. Click on it to exchange the token for a JWT, then
click Next. You should now have a valid JWT. Copy it for use in the next
section.

<p
  style="text-align: center"
>
  <img
  src="https://raw.githubusercontent.com/statsbotco/cube.js/master/docs/content/Auth/auth0-03-get-jwt-03.png"
  style="border: none"
  width="80%"
  />
</p>
### Set JWT in Developer Playground

Now open the Developer Playground (at `http://localhost:4000`) and on the Build
page, click Add Security Context.

<p
  style="text-align: center"
>
  <img
  src="https://raw.githubusercontent.com/statsbotco/cube.js/master/docs/content/Auth/auth0-04-dev-playground-01.png"
  style="border: none"
  width="80%"
  />
</p>
Click the Token tab, paste the JWT from OpenID Playground and click the Save
button.

<p
  style="text-align: center"
>
  <img
  src="https://raw.githubusercontent.com/statsbotco/cube.js/master/docs/content/Auth/auth0-04-dev-playground-02.png"
  style="border: none"
  width="80%"
  />
</p>
Close the popup and use the Developer Playground to make a request. Any schemas
using the [Security Context][ref-sec-ctx] should now work as expected.

[link-auth0-app]: https://manage.auth0.com/
[link-auth0-js]: https://auth0.com/docs/libraries/auth0js
[link-auth0-spa-sdk]: https://auth0.com/docs/libraries/auth0-spa-js
[link-auth0-api]:
  https://auth0.com/docs/tokens/access-tokens#json-web-token-access-tokens
[link-openid-playground]: https://openidconnect.net/
[ref-sec-ctx]: /security#security-context
