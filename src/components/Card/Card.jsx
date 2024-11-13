import React from 'react';
import styled from 'styled-components';

const Card = ({ 
  imgSrc, 
  header, 
  text, 
  buttonText 
}) => (
  <StyledCard>
    <img className="card__img" src={imgSrc} alt={header} />
    <div className="card__content">
      <h1 className="card__header">{header}</h1>
      <p className="card__text">{text}</p>
      <button className="card__btn">{buttonText} <span>&rarr;</span></button>
    </div>
  </StyledCard>
);

const StyledCard = styled.div`
  position: absolute;
  width: 15rem;
  height: 18rem;
  display: flex;
  flex-direction: column;
  border-radius: 0.4rem;
  overflow: hidden;
  cursor: pointer;
  transition: 0.2s;
  top: 5rem;
  left: 2rem;

  &:hover {
    transform: translateY(-0.5%);
  }

  .card__img {
    width: 100%;
    height: 60%;
    object-fit: cover;
  }

  .card__content {
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 40%;
    background-color: #fff;
  }

  .card__header {
    font-size: 1.2rem;
    font-weight: 500;
    color: #0d0d0d;
    margin: 0;
  }

  .card__text {
    font-size: 0.9rem;
    color: #404040;
    margin: 0.5rem 0;
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card__btn {
    padding: 0.5rem;
    font-size: 1rem;
    text-align: center;
    color: #3363ff;
    background-color: #e6ecff;
    border: none;
    border-radius: 0.4rem;
    transition: 0.2s;
    cursor: pointer;

    span {
      margin-left: 0.5rem;
      transition: 0.2s;
    }

    &:hover,
    &:active {
      background-color: darken(#e6ecff, 2%);

      span {
        margin-left: 0.7rem;
      }
    }
  }
`;

export default Card;
