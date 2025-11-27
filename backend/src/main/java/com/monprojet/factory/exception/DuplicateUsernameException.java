// InvalidCredentialsException.java
package com.monprojet.factory.exception;

public class DuplicateUsernameException extends RuntimeException {
    public DuplicateUsernameException(String message) {
        super(message);
    }
}