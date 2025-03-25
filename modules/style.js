export const style = (color = "blue") => new ol.style.Style({
  stroke: new ol.style.Stroke({ color: color, width: 2 })
});

export const nodeStyle = (color = "blue", radius = 50, text = "") => new ol.style.Style({
  image: new ol.style.Circle({
    radius: radius,
    fill: new ol.style.Fill({ color: color })
  }),
  text: new ol.style.Text({
    offsetX: 10,
    offsetY: 10,
    text: text,
    fill: new ol.style.Fill({ color: 'black' })
  })
});
