const config = {
  baseUrl: "https://mesto.nomoreparties.co/v1/apf-cohort-202",
  headers: {
    authorization: "b467a041-a34e-4276-a457-166468e85eb0",
    "Content-Type": "application/json"
  }
};

function getResponseData(res) {
  if (res.ok) {
    return res.json();
  }
  return Promise.reject(`Ошибка: ${res.status}`);
}

export function getUserInfo() {
  return fetch(`${config.baseUrl}/users/me`, {
    headers: config.headers
  }).then(getResponseData);
}

export function getCardList() {
  return fetch(`${config.baseUrl}/cards`, {
    headers: config.headers
  }).then(getResponseData);
}

export function setUserInfo({ name, about }) {
  return fetch(`${config.baseUrl}/users/me`, {
    method: "PATCH",
    headers: config.headers,
    body: JSON.stringify({ name, about }),
  }).then(getResponseData);
}

export function updateUserAvatar({ avatar }) {
  return fetch(`${config.baseUrl}/users/me/avatar`, {
    method: "PATCH",
    headers: config.headers,
    body: JSON.stringify({ avatar }),
  }).then(getResponseData);
}

export function addNewCard({ name, link }) {
  return fetch(`${config.baseUrl}/cards`, {
    method: "POST",
    headers: config.headers,
    body: JSON.stringify({ name, link }),
  }).then(getResponseData);
}

export function deleteCard(cardId) {
  return fetch(`${config.baseUrl}/cards/${cardId}`, {
    method: "DELETE",
    headers: config.headers,
  }).then(getResponseData);
}

export function changeLikeCardStatus(cardId, isLiked) {
  return fetch(`${config.baseUrl}/cards/likes/${cardId}`, {
    method: isLiked ? "DELETE" : "PUT",
    headers: config.headers,
  }).then(getResponseData);
}