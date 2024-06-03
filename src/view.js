import { Modal } from 'bootstrap';

const errorHandler = (errorName, elements, i18n) => {
  elements.input.classList.add('is-invalid');
  elements.feedbackMessage.textContent = i18n.t(`feedbackMessage.${errorName}`);
  elements.feedbackMessage.classList.remove('text-success');
  elements.feedbackMessage.classList.add('text-danger');
};

const successHandler = (elements, i18n) => {
  elements.input.classList.remove('is-invalid');
  elements.feedbackMessage.classList.remove('text-danger');
  elements.feedbackMessage.classList.add('text-success');
  elements.feedbackMessage.textContent = i18n.t('feedbackMessage.success');
  elements.form.reset();
  elements.input.focus();
};

const feedHandler = (lastAddedFeed, elements, i18n) => {
  if (!elements.feeds.querySelector('h2')) {
    const feedsCard = document.createElement('div');
    feedsCard.classList.add('card', 'border-0');

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    const feedsHeader = document.createElement('h2');
    feedsHeader.textContent = i18n.t('content.feeds');
    feedsHeader.classList.add('card-title', 'h3');
    cardBody.append(feedsHeader);

    const feedsList = document.createElement('ul');
    feedsList.classList.add('list-feeds', 'list-group', 'border-0', 'rounded-0');

    feedsCard.append(cardBody, feedsList);
    elements.feeds.append(feedsCard);
  }

  const feedEl = document.createElement('li');
  feedEl.classList.add('list-feeds-item', 'list-group-item', 'border-0', 'border-end-0');
  const h3 = document.createElement('h3');
  h3.textContent = lastAddedFeed.title;
  const p = document.createElement('p');
  p.textContent = lastAddedFeed.description;
  feedEl.append(h3, p);
  document.querySelector('.list-feeds').prepend(feedEl);
};

const visitedPostsHandler = (postId) => {
  const clickedEl = document.querySelector(
    `a[data-id="${postId}"]`,
  );
  clickedEl.classList.remove('fw-bold');
  clickedEl.classList.add('fw-normal', 'link-secondary');
};
const postHandler = (posts, elements, i18n) => {
  if (!elements.posts.querySelector('h2')) {
    const postsCard = document.createElement('div');
    postsCard.classList.add('card', 'border-0');

    const headerCard = document.createElement('div');
    headerCard.classList.add('card-body');
    const cardTitle = document.createElement('h2');
    cardTitle.textContent = i18n.t('content.posts');
    cardTitle.classList.add('card-title', 'h3');
    headerCard.append(cardTitle);

    const postsList = document.createElement('ul');
    postsList.classList.add('list-posts', 'list-group', 'border-0', 'rounded-0');

    postsCard.append(headerCard, postsList);
    elements.posts.append(postsCard);
  }
  posts.forEach((post) => {
    const postEl = document.createElement('li');
    postEl.classList.add(
      'list-posts-item',
      'list-group-item',
      'd-flex',
      'justify-content-between',
      'align-items-start',
      'border-0',
      'border-end-0',
    );
    const a = document.createElement('a');
    a.setAttribute('href', post.link);
    a.textContent = post.title;
    a.setAttribute('target', '_blank');
    a.classList.add('fw-bold');
    a.dataset.id = post.id;
    const btn = document.createElement('button');
    btn.textContent = i18n.t('content.show');
    btn.dataset.id = post.id;
    btn.classList.add('button-show-more', 'btn', 'btn-sm', 'btn-outline-primary');
    postEl.append(a, btn);
    document.querySelector('.list-posts').prepend(postEl);
  });
};

const modalContentHandler = (modalContent, elements) => {
  const { modalElements } = elements;
  modalElements.title.textContent = modalContent.title;
  modalElements.body.textContent = modalContent.description;
  modalElements.btnFullArticle.setAttribute('href', modalContent.link);
};

const modalShowHandler = (isShown, elements) => {
  const modal = new Modal(elements.modalElements.container);
  if (isShown) {
    modal.show();
  }
};

const processStatusHandler = (elements, process, state, i18n) => {
  elements.input.disabled = false;
  elements.submitButton.disabled = false;

  switch (process) {
    case 'error':
      errorHandler(state.form.errors, elements, i18n);
      break;
    case 'sending':
      elements.input.disabled = true;
      elements.submitButton.disabled = true;
      break;
    case 'success':
      successHandler(elements, i18n);
      break;
    default:
      throw new Error(`Unknown process state: ${process}`);
  }
};

const initView = (state, elements, i18n) => (path, value, _, applyData) => {
  switch (path) {
    case 'content.feeds':
      feedHandler(...applyData.args, elements, i18n);
      break;
    case 'content.posts':
      postHandler(applyData.args, elements, i18n);
      break;
    case 'form.status':
      processStatusHandler(elements, value, state, i18n);
      break;
    case 'modal':
      modalContentHandler(value, elements);
      break;
    case 'uiState.modalShow':
      modalShowHandler(value, elements);
      break;
    case 'uiState.visitedPosts':
      visitedPostsHandler(...applyData.args);
      break;
    default:
      break;
  }
};

export default initView;
