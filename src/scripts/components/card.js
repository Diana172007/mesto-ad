export const createCardElement = (
  data,
  { onPreviewPicture, onLikeIcon, onDeleteCard, userId }
) => {
  const template = document.getElementById("card-template");
  const cardElement = template.content.querySelector(".card").cloneNode(true);
  
  cardElement.dataset.cardId = data._id;
  
  const likeButton = cardElement.querySelector(".card__like-button");
  const deleteButton = cardElement.querySelector(".card__control-button_type_delete");
  const cardImage = cardElement.querySelector(".card__image");
  const likeCountElement = cardElement.querySelector(".card__like-count");
  const cardTitle = cardElement.querySelector(".card__title");

  cardImage.src = data.link;
  cardImage.alt = data.name;
  cardTitle.textContent = data.name;
  
  if (likeCountElement) {
    likeCountElement.textContent = data.likes ? data.likes.length : 0;
  }

  if (userId && data.likes) {
    const isLikedByUser = data.likes.some(like => like._id === userId);
    if (isLikedByUser) {
      likeButton.classList.add('card__like-button_is-active');
    }
  }

  if (userId && data.owner && data.owner._id !== userId) {
    deleteButton.remove();
  }

  if (onLikeIcon) {
    likeButton.addEventListener("click", () => onLikeIcon(likeButton, data._id));
  }

  if (onDeleteCard) {
    deleteButton.addEventListener("click", () => onDeleteCard(cardElement, data._id));
  }

  if (onPreviewPicture) {
    cardImage.addEventListener("click", () => 
      onPreviewPicture({name: data.name, link: data.link})
    );
  }

  return cardElement;
};