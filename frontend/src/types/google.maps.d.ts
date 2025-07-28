declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: new (
            inputField: HTMLInputElement,
            options?: google.maps.places.AutocompleteOptions
          ) => google.maps.places.Autocomplete;
          PlaceResult: google.maps.places.PlaceResult;
        };
      };
    };
  }
}