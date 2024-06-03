import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';
import _, { uniqueId } from 'lodash';
import i18next from 'i18next';
import view from './view.js';
import resources from './locales/index.js';

const parse = (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'application/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    throw new Error('Parsing Error');
  }

  const title = doc.querySelector('title').textContent;
  const description = doc.querySelector('description').textContent;
  const posts = [...doc.querySelectorAll('item')]
    .map((item) => {
      const post = {
        title: item.querySelector('title').textContent,
        link: item.querySelector('link').textContent,
        description: item.querySelector('description').textContent,
      };

      return post;
    });
  return { title, description, posts };
};

const app = (i18nextInstance) => {
  const state = {
    form: {
      status: 'filling',
      rssUrls: [],
      errors: '',
    },
    modal: {},
    content: {
      feeds: [],
      posts: [],
    },
    uiState: {
      modalShow: false,
      visitedPosts: [],
    },
  };

  const elements = {
    input: document.getElementById('url-input'),
    submitButton: document.getElementById('rss-submit'),
    form: document.querySelector('form'),
    feedbackMessage: document.querySelector('.feedback'),
    feeds: document.querySelector('.feeds'),
    posts: document.querySelector('.posts'),
    modalElements: {
      container: document.querySelector('.modal'),
      title: document.querySelector('.modal-title'),
      body: document.querySelector('.modal-body'),
      btnsClose: document.querySelectorAll('.close'),
      btnFullArticle: document.querySelector('.full-article'),
    },
  };

  const watchedState = onChange(state, view(state, elements, i18nextInstance));

  const buildOriginUrl = (url) => {
    const originUrl = new URL('/get', 'https://allorigins.hexlet.app');
    originUrl.searchParams.set('disableCache', true);
    originUrl.searchParams.set('url', url);
    return originUrl.href;
  };

  const getPosts = (inputedUrl) => {
    const originURL = buildOriginUrl(inputedUrl);
    return axios
      .get(originURL)
      .then((response) => {
        const feed = parse(response.data.contents);
        feed.id = uniqueId();
        feed.posts.forEach((post) => {
          post.id = uniqueId();
          post.feedId = feed.id;
        });
        return feed;
      })
      .catch((err) => {
        throw err;
      });
  };

  const checkNewPosts = () => {
    const promises = watchedState.form.rssUrls.map(({ url, feedId }) => getPosts(url)
      .then((newContent) => {
        const newPosts = newContent.posts
          .filter((post) => {
            const alreadyExists = watchedState.content.posts.find(
              (oldPost) => oldPost.link === post.link,
            );
            return (!alreadyExists);
          })
          .map((post) => {
            post.feedId = feedId;
            return post;
          });
        watchedState.content.posts.push(...newPosts);
      })
      .catch((e) => {
        console.log(e);
      }));
    return Promise.all(promises);
  };

  yup.setLocale({
    string: {
      url: 'invalidUrl',
    },
    mixed: {
      notOneOf: 'alreadyExists',
    },
  });

  const validate = (field, urls) => {
    const schema = yup.object({
      url: yup
        .string()
        .url()
        .notOneOf(urls)
        .required(),
    });
    return schema
      .validate(field, { abortEarly: false })
      .then(() => {})
      .catch((e) => {
        throw _.keyBy(e.inner, 'path');
      });
  };

  setTimeout(function run() {
    checkNewPosts()
      .then(() => {
        setTimeout(run, 5000);
      });
  }, 5000);

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.form.status = 'sending';
    const urls = watchedState.form.rssUrls.map((item) => item.url);
    const { value } = elements.input;

    validate({ url: value }, urls)
      .then(() => getPosts(value))
      .then((content) => {
        const {
          title, description, id, posts,
        } = content;
        watchedState.form.rssUrls.push({ url: value, feedId: id });
        watchedState.content.feeds.push({ title, description, id });
        watchedState.content.posts.push(...posts);
        watchedState.form.status = 'success';
      })
      .catch((err) => {
        switch (err.message) {
          case 'Network Error':
            watchedState.form.errors = 'networkError';
            break;
          case 'Parsing Error':
            watchedState.form.errors = 'invalidRSS';
            break;
          default:
            watchedState.form.errors = err.url.message;
            break;
        }
        watchedState.form.status = 'error';
      });
  });

  elements.posts.addEventListener('click', (e) => {
    const clickedLink = e.target.closest('.list-posts-item > a');
    if (clickedLink) {
      watchedState.uiState.visitedPosts.push(clickedLink.dataset.id);
      return;
    }

    const clickedButton = e.target.closest('.button-show-more');
    if (clickedButton) {
      const currentPost = watchedState.content.posts.find(
        (post) => post.id === clickedButton.dataset.id,
      );
      const { title, description, link } = currentPost;
      watchedState.modal = { title, description, link };
      watchedState.uiState.modalShow = true;
      watchedState.uiState.visitedPosts.push(currentPost.id);
    }
  });

  elements.modalElements.btnsClose.forEach((btn) => {
    btn.addEventListener('click', () => {
      watchedState.uiState.modalShow = false;
    });
  });
  elements.modalElements.container.addEventListener('click', (e) => {
    if (!e.target.closest('.modal-content')) {
      watchedState.uiState.modalShow = false;
    }
  });
};

export default () => {
  const i18nextInstance = i18next.createInstance();
  i18nextInstance
    .init({
      lng: 'ru',
      debug: true,
      resources,
    })
    .then(() => app(i18nextInstance));
};
