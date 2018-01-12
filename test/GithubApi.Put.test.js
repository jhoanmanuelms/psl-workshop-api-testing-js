const agent = require('superagent-promise')(require('superagent'), Promise);
const statusCode = require('http-status-codes');
const { expect } = require('chai');

describe('Github API PUT Method Test', () => {
  const urlBase = 'https://api.github.com';
  const followedUser = 'aperdomob';

  describe('Given a Github user', () => {
    describe('When the user follows another user', () => {
      let followResponse;

      before(() => {
        const request =
          agent.put(`${urlBase}/user/following/${followedUser}`)
            .auth('token', process.env.ACCESS_TOKEN).then((response) => {
              followResponse = response;
            });

        return request;
      });

      it('Then the request should be successfully executed', () => {
        expect(followResponse.status).to.eql(statusCode.NO_CONTENT);
        expect(followResponse.body).to.eql({});
      });
    });

    describe('When the user want to verify to whom is following', () => {
      let userToVerify;

      before(() => {
        const request = agent.get(`${urlBase}/user/following`)
          .auth('token', process.env.ACCESS_TOKEN).then((response) => {
            userToVerify = response.body.find(user => user.login === followedUser);
          });

        return request;
      });

      it('Then the followed user should be in the list', () => {
        expect(userToVerify.login).to.eql(followedUser);
      });
    });

    describe('When the user follows the same user again', () => {
      let followResponse;

      before(() => {
        const request =
          agent.put(`${urlBase}/user/following/${followedUser}`)
            .auth('token', process.env.ACCESS_TOKEN).then((response) => {
              followResponse = response;
            });

        return request;
      });

      it('Then the method should be idempotent', () => {
        expect(followResponse.status).to.eql(statusCode.NO_CONTENT);
        expect(followResponse.body).to.eql({});
      });
    });
  });
});
