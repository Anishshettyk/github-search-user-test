import React, { useState, useEffect } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setgithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);
  //request
  const [request, setRequest] = useState(0);
  const [Isloading, setIsLoading] = useState(false);
  //errors
  const [error, setError] = useState({ show: false, msg: '' });

  const searchGithubUser = async (user) => {
    //handle error
    toggleError(); //to set back to default

    setIsLoading(true);

    const response = await axios(`${rootUrl}/users/${user}`).catch((error) => console.log(error));

    if (response) {
      setgithubUser(response.data);

      const { login, followers_url } = response.data;

      await Promise.allSettled([axios(`${rootUrl}/users/${login}/repos?per_page=100`), axios(`${followers_url}?per_page=100`)])
        .then((results) => {
          const [repos, followers] = results;
          const status = 'fulfilled';
          if (repos.status === status) {
            setRepos(repos.value.data);
          }
          if (followers.status === status) {
            setFollowers(followers.value.data);
          }
        })
        .catch((error) => console.log(error));
    } else {
      toggleError(true, 'there is no user found');
    }

    checkRequests();
    setIsLoading(false);
  };

  //check rate
  const checkRequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;
        setRequest(remaining);
        if (remaining === 0) {
          toggleError(true, `Sorry you can't perform any request now`);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };
  //error
  function toggleError(show = false, msg = '') {
    setError({ show, msg });
  }

  useEffect(checkRequests, []);
  return (
    <GithubContext.Provider value={{ githubUser, repos, followers, request, error, searchGithubUser, Isloading }}>
      {children}
    </GithubContext.Provider>
  );
};

export { GithubProvider, GithubContext };
