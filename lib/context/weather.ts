export type WeatherData = {
  condition: string
  temperatureCelsius: number
  recommendation: string
}

export function getMockWeather(city: string): WeatherData {
  return {
    condition: 'Partly cloudy',
    temperatureCelsius: 14,
    recommendation: 'A light jacket is advisable for the evening.',
  }
}
