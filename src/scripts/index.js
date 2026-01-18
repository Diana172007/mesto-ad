import { createCardElement } from "./components/card.js";
import {
  openModalWindow,
  closeModalWindow,
  setCloseModalWindowEventListeners,
} from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";
import { 
  getUserInfo, 
  getCardList, 
  setUserInfo, 
  updateUserAvatar, 
  addNewCard,
  deleteCard,
  changeLikeCardStatus
} from './components/api.js';

const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const deleteConfirmModalWindow = document.querySelector(".popup_type_remove-card");
const deleteConfirmForm = deleteConfirmModalWindow.querySelector(".popup__form");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");
const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const popupInfo = document.querySelector('#popup-info');
const logo = document.querySelector('.header__logo');

let currentUserId = null;
let cardToDelete = null;
let cardIdToDelete = null;

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  
  const submitButton = evt.submitter;
  const originalText = submitButton.textContent;
  submitButton.textContent = "Сохранение...";
  
  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch(() => {})
    .finally(() => submitButton.textContent = originalText);
};

const handleAvatarFromSubmit = (evt) => {
  evt.preventDefault();
  
  const submitButton = evt.submitter;
  const originalText = submitButton.textContent;
  submitButton.textContent = "Сохранение...";
  
  updateUserAvatar({ avatar: avatarInput.value })
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url('${userData.avatar}')`;
      closeModalWindow(avatarFormModalWindow);
      avatarForm.reset();
    })
    .catch(() => {})
    .finally(() => submitButton.textContent = originalText);
};

const handleLike = (likeButton, cardId) => {
  const isLiked = likeButton.classList.contains('card__like-button_is-active');
  const likeCountElement = likeButton.closest('.card').querySelector('.card__like-count');
  let currentCount = parseInt(likeCountElement.textContent) || 0;
  
  if (isLiked) {
    likeButton.classList.remove('card__like-button_is-active');
    likeCountElement.textContent = Math.max(0, currentCount - 1);
  } else {
    likeButton.classList.add('card__like-button_is-active');
    likeCountElement.textContent = currentCount + 1;
  }
  
  changeLikeCardStatus(cardId, isLiked)
    .then(updatedCard => {
      likeCountElement.textContent = updatedCard.likes.length;
      likeButton.classList.toggle('card__like-button_is-active', 
        updatedCard.likes.some(like => like._id === currentUserId));
    });
};

const handleDeleteCardClick = (cardElement, cardId) => {
  cardToDelete = cardElement;
  cardIdToDelete = cardId;
  openModalWindow(deleteConfirmModalWindow);
};

const handleDeleteConfirm = (evt) => {
  evt.preventDefault();
  
  const submitButton = evt.submitter;
  const originalText = submitButton.textContent;
  submitButton.textContent = "Удаление...";
  
  if (cardToDelete) {
    cardToDelete.remove();
  }
  
  closeModalWindow(deleteConfirmModalWindow);
  
  deleteCard(cardIdToDelete)
    .finally(() => {
      submitButton.textContent = originalText;
      cardToDelete = null;
      cardIdToDelete = null;
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  
  const submitButton = evt.submitter;
  const originalText = submitButton.textContent;
  submitButton.textContent = "Создание...";
  
  addNewCard({
    name: cardNameInput.value,
    link: cardLinkInput.value
  })
    .then((newCard) => {
      placesWrap.prepend(
        createCardElement(newCard, {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: handleLike,
          onDeleteCard: handleDeleteCardClick,
          userId: currentUserId
        })
      );
      closeModalWindow(cardFormModalWindow);
      cardForm.reset();
      clearValidation(cardForm, validationSettings);
    })
    .catch(() => {})
    .finally(() => submitButton.textContent = originalText);
};

function calculateStatistics(cards) {
  const stats = {
    totalUsers: new Set(),
    totalLikes: 0,
    maxLikes: 0,
    championName: '—',
    popularCards: []
  };
  
  const userLikes = {};
  
  cards.forEach(card => {
    stats.totalLikes += card.likes.length;
    stats.totalUsers.add(card.owner._id);
    
    card.likes.forEach(like => {
      stats.totalUsers.add(like._id);
      
      const userId = like._id;
      const userName = like.name;
      
      if (!userLikes[userId]) {
        userLikes[userId] = { name: userName, likes: 0 };
      }
      userLikes[userId].likes++;
    });
  });
  
  let maxLikesFromOne = 0;
  let championName = '—';
  
  Object.values(userLikes).forEach(user => {
    if (user.likes > maxLikesFromOne) {
      maxLikesFromOne = user.likes;
      championName = user.name;
    }
  });
  
  stats.maxLikes = maxLikesFromOne;
  stats.championName = championName;
  
  stats.popularCards = [...cards].map((card) => ({
    id: card._id,
    name: card.name || 'Без названия'
  }));
  
  return stats;
}

function fillStatisticsPopup(stats) {
  const totalUsersElement = document.querySelector('.popup-info__total-users');
  const totalLikesElement = document.querySelector('.popup-info__total-likes');
  const maxLikesElement = document.querySelector('.popup-info__max-likes');
  const championNameElement = document.querySelector('.popup-info__champion-name');
  
  if (totalUsersElement) totalUsersElement.textContent = stats.totalUsers.size;
  if (totalLikesElement) totalLikesElement.textContent = stats.totalLikes;
  if (maxLikesElement) maxLikesElement.textContent = stats.maxLikes;
  if (championNameElement) championNameElement.textContent = stats.championName;
  
  const cardsContainer = document.querySelector('#popular-cards-container');
  if (!cardsContainer) return;
  
  cardsContainer.innerHTML = '';
  
  const scrollContainer = document.createElement('div');
  scrollContainer.className = 'popup__list';
  
  const columnsContainer = document.createElement('div');
  columnsContainer.className = 'popup__info';
  
  const table = document.createElement('table');
  const tableRow = document.createElement('tr');
  
  const columns = [];
  for (let i = 0; i < 3; i++) {
    const cell = document.createElement('td');
    
    const columnList = document.createElement('ul');
    columnList.className = 'popup__info';
    cell.appendChild(columnList);
    columns.push(columnList);
    
    tableRow.appendChild(cell);
  }
  
  table.appendChild(tableRow);
  
  const cardsPerColumn = Math.ceil(stats.popularCards.length / 3);
  
  stats.popularCards.forEach((card, index) => {
    let columnIndex;
    if (index < cardsPerColumn) {
      columnIndex = 0;
    } else if (index < cardsPerColumn * 2) {
      columnIndex = 1;
    } else {
      columnIndex = 2;
    }
    
    const listItem = document.createElement('li');
    listItem.className = 'popup__info-item';
    
    let displayName = card.name;
    if (card.name.length > 12) {
      displayName = card.name.substring(0, 12) + '...';
    }
    
    const cardName = document.createElement('span');
    cardName.className = 'popup__info-term';
    cardName.textContent = displayName;
    cardName.title = card.name;
    
    listItem.appendChild(cardName);
    columns[columnIndex].appendChild(listItem);
  });
  
  columnsContainer.appendChild(table);
  scrollContainer.appendChild(columnsContainer);
  cardsContainer.appendChild(scrollContainer);
}

function openStatistics() {
  if (!popupInfo) return;
  
  getCardList()
    .then(cards => {
      const stats = calculateStatistics(cards);
      fillStatisticsPopup(stats);
      openModalWindow(popupInfo);
    })
    .catch(() => {
      const cardsContainer = document.querySelector('#popular-cards-container');
      if (cardsContainer) {
        cardsContainer.innerHTML = '';
      }
      openModalWindow(popupInfo);
    });
}

enableValidation(validationSettings);
profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFromSubmit);
deleteConfirmForm.addEventListener("submit", handleDeleteConfirm);

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationSettings);
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  clearValidation(avatarForm, validationSettings);
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  clearValidation(cardForm, validationSettings);
  openModalWindow(cardFormModalWindow);
});

Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    currentUserId = userData._id;
    
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    if (userData.avatar) {
      profileAvatar.style.backgroundImage = `url('${userData.avatar}')`;
    }
    
    cards.forEach((card) => {
      placesWrap.append(
        createCardElement(card, {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: handleLike,
          onDeleteCard: handleDeleteCardClick,
          userId: currentUserId
        })
      );
    });
  })
  .catch(() => {});

if (logo && popupInfo) {
  logo.addEventListener('click', openStatistics);
}

const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});