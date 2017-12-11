const agent = require('superagent-promise')(require('superagent'), Promise);
const statusCode = require('http-status-codes');
const { expect } = require('chai');
const chai = require('chai');
const md5 = require('md5');
chai.use(require('chai-subset'));

const urlBase = 'https://api.github.com';
const githubUserName = 'aperdomob';
const testRepo = 'jasmine-awesome-report';

describe('Github Repositories API Test', () => {
  describe('Given a user from Github', () => {
    describe('When using the Github API to get the user info', () => {
      let userInfoReponse;
      before(() => {
        const request =
          agent.get(`${urlBase}/users/${githubUserName}`).then((response) => {
            userInfoReponse = response;
          });

        return request;
      });

      it('Then the user info should contain valid data', () => {
        const userInfo = userInfoReponse.body;
        expect(userInfoReponse.statusCode).to.equal(statusCode.OK);
        expect(userInfo.company).to.equal('PSL');
        expect(userInfo.location).to.equal('Colombia');
        expect(userInfo.name).to.equal('Alejandro Perdomo');
      });
    });

    describe('When using the Github API to get the user repositories', () => {
      let userReposResponse;
      let testRepoInfo;
      before((done) => {
        agent.get(`${urlBase}/users/${githubUserName}`).then((response) => {
          agent.get(response.body.repos_url).then((reposResponse) => {
            userReposResponse = reposResponse;
            done();
          });
        });
      });

      it('Then the repos list should contain the expected repo', () => {
        const repos = userReposResponse.body;
        testRepoInfo = repos.find(repo => repo.name === testRepo);

        expect(userReposResponse.statusCode).to.equal(statusCode.OK);
        expect(testRepoInfo.private).to.equal(false);
        expect(testRepoInfo.full_name).to.equal('aperdomob/jasmine-awesome-report');
        expect(testRepoInfo.description).to.equal('An awesome html report for Jasmine');
      });
    });

    describe('When the user downloads a project', () => {
      let projectContent;
      before((done) => {
        agent.get(`${urlBase}/users/${githubUserName}`).then((response) => {
          agent.get(response.body.repos_url).then((reposResponse) => {
            const testRepoInfo = reposResponse.body.find(repo => repo.name === testRepo);
            agent.get(`${testRepoInfo.svn_url}/archive/${testRepoInfo.default_branch}.zip`)
              .buffer(true).then((projectContentResponse) => {
                projectContent = projectContentResponse.text;
                done();
              });
          });
        });
      });

      it('Then the project should be downloaded with a valid MD5', () => {
        const randomMD5 = '0f538a0edbdde15fa85ecfa769f989a6';
        expect(md5(projectContent)).to.not.equal(randomMD5);
      });
    });

    describe('When the user verifies the Read Me file metadata', () => {
      let readmeFile;

      before((done) => {
        agent.get(`${urlBase}/users/${githubUserName}`).then((response) => {
          agent.get(response.body.repos_url).then((reposResponse) => {
            const testRepoInfo = reposResponse.body.find(repo => repo.name === testRepo);
            agent.get(`${testRepoInfo.url}/contents`).then((projectContentResponse) => {
              readmeFile = projectContentResponse.body.find(file => file.name === 'README.md');
              done();
            });
          });
        });
      });

      it('Then the Read Me file should be downloaded with valid data', () => {
        expect(readmeFile).containSubset({
          name: 'README.md',
          path: 'README.md',
          sha: '9bcf2527fd5cd12ce18e457581319a349f9a56f3'
        });
      });
    });

    describe('When the user verifies the Read Me file content', () => {
      let readmeFileContent;

      before((done) => {
        agent.get(`${urlBase}/users/${githubUserName}`).then((response) => {
          agent.get(response.body.repos_url).then((reposResponse) => {
            const testRepoInfo = reposResponse.body.find(repo => repo.name === testRepo);
            agent.get(`${testRepoInfo.url}/contents`).then((projectContentResponse) => {
              const readmeFile = projectContentResponse.body.find(file => file.name === 'README.md');
              agent.get(readmeFile.download_url).then((fileContentResponse) => {
                readmeFileContent = fileContentResponse.text;
                done();
              });
            });
          });
        });
      });

      it('Then the Read Me file should be correctly downloaded', () => {
        expect(md5(readmeFileContent)).to.equal('8a406064ca4738447ec522e639f828bf');
      });
    });
  });
});
