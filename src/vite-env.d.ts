/// <reference types="vite/client" />

interface Window {
	downloadRunLog: () => void;
	getRunLog: () => unknown;
}