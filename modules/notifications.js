export function showNotification(message, type = 'info', duration = 6000) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.offsetHeight;

  // Show notification
  notification.classList.add('show');

  // Hide after duration
  setTimeout(() => {
    notification.classList.remove('show');
  }, duration);
}

export function updateRuntimeDisplay(res) {
  const algorithmDisplay = document.getElementById('algorithmDisplay');
  if (!res) {
    document.getElementById('runtimeDisplay').textContent = '- ms';
    document.getElementById('pathLengthDisplay').textContent = '- m';
    document.getElementById('totalNodesCount').textContent = '-';
    algorithmDisplay.textContent = '-';
    algorithmDisplay.className = 'runtime-value';
    return;
  }

  document.getElementById('runtimeDisplay').textContent = `${res.runtime.toFixed(2)} ms`;

  if (res?.pathLength) {
    if (res.pathLength === "-") {
      document.getElementById('pathLengthDisplay').textContent = "- m";
    } else {
      const [distance, unit] = calculateDistanceAndUnit(res.pathLength);
      document.getElementById('pathLengthDisplay').textContent = `${(distance).toFixed(2)} ${unit}`;
    }
  } else {
    document.getElementById('pathLengthDisplay').textContent = '- m';
  }

  document.getElementById('totalNodesCount').textContent = res?.path ? res.path.length.toString() : "-";
}

function calculateDistanceAndUnit(pathLength) {
  if (pathLength < 1000) {
    return [pathLength, "m"];
  }
  return [pathLength / 1000, "km"];
}
