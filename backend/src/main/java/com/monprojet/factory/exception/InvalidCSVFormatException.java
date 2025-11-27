package com.monprojet.factory.exception;

public class InvalidCSVFormatException extends RuntimeException {
    public InvalidCSVFormatException(String message) {
        super(message);
    }

    public InvalidCSVFormatException(String message, Throwable cause) {
        super(message, cause);
    }
}