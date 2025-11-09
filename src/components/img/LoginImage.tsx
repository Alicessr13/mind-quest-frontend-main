import React from 'react';
import { Image, StyleSheet } from 'react-native';

const LoginImage = () => {
  return (
    <Image
      source={require('../../assets/img/loginImage.png')}
      style={styles.image}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  image: {
    width: '90%',
    height: 170,
    marginBottom: 30,
    borderRadius: 12,
    alignSelf: 'center',
  }
});

export default LoginImage;