import React, { useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { API_ROUTES, APP_ROUTES } from '../../utils/constants';
import { useUser } from '../../lib/customHooks';
import { storeInLocalStorage } from '../../lib/common';
import { ReactComponent as Logo } from '../../images/Logo.svg';
import styles from './SignIn.module.css';

function SignIn({ setUser }) {
  const navigate = useNavigate();
  const { user, authenticated } = useUser();

  if (user || authenticated) {
    navigate(APP_ROUTES.DASHBOARD);
  }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ error: false, message: '' });

  const signIn = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(API_ROUTES.SIGN_IN, { email, password });

      if (!response?.data?.token) {
        setNotification({ error: true, message: 'Une erreur est survenue' });
      } else {
        storeInLocalStorage(response.data.token, response.data.userId);
        setUser(response.data);
        navigate('/');
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setNotification({ error: true, message: err.response.data.message });
      } else {
        setNotification({ error: true, message: 'Une erreur inattendue est survenue.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(API_ROUTES.SIGN_UP, { email, password });

      if (response?.data) {
        setNotification({ error: false, message: 'Votre compte a bien été créé, vous pouvez vous connecter' });
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setNotification({ error: true, message: err.response.data.message });
      } else {
        setNotification({ error: true, message: 'Une erreur inattendue est survenue.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const errorClass = notification.error ? styles.Error : null;

  return (
    <div className={`${styles.SignIn} container`}>
      <Logo />
      <div className={`${styles.Notification} ${errorClass}`}>
        {notification.message.length > 0 && <p>{notification.message}</p>}
      </div>
      <div className={styles.Form}>
        <label htmlFor="email">
          <p>Adresse email</p>
          <input
            type="text"
            name="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label htmlFor="password">
          <p>Mot de passe</p>
          <input
            type="password"
            name="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <div className={styles.Submit}>
          <button
            type="submit"
            className="p-2 rounded-md w-1/2 self-center bg-gray-800 text-white hover:bg-gray-800"
            onClick={signIn}
          >
            {isLoading && <div className="" />}
            <span>Se connecter</span>
          </button>
          <span>OU</span>
          <button
            type="submit"
            className="p-2 rounded-md w-1/2 self-center bg-gray-800 text-white hover:bg-gray-800"
            onClick={signUp}
          >
            {isLoading && <div className="mr-2 w-5 h-5 border-l-2 rounded-full animate-spin" />}
            <span>S&apos;inscrire</span>
          </button>
        </div>
      </div>
    </div>
  );
}

SignIn.propTypes = {
  setUser: PropTypes.func.isRequired,
};

export default SignIn;
