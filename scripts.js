// Función principal para buscar un elemento dentro de cualquier shadowRoot
function findElementInAnyShadowRoot(root, selector) {
  if (!root) return null;

  // Intentar encontrar el elemento en el root actual
  let element = root.querySelector(selector);
  if (element) return element;

  // Buscar en los shadowRoots de los hijos de root
  for (const child of root.children) {
    const found = findInChildShadowRoot(child, selector);
    if (found) return found;
  }

  return null;
}

// Función para buscar en el shadowRoot de un hijo y sus elementos internos
function findInChildShadowRoot(child, selector) {
  if (child.shadowRoot) {
    return findElementInAnyShadowRoot(child.shadowRoot, selector);
  }

  if (child.classList?.contains("entry") && child.classList.contains("bot")) {
    return findInEntryShadowRoot(child, selector);
  }

  return null;
}

// Buscar en el shadowRoot de un elemento con clase .entry
function findInEntryShadowRoot(entry, selector) {
  const utterance = entry.querySelector("df-messenger-utterance");

  if (!utterance || !utterance.shadowRoot) return null;

  const messageStack = utterance.shadowRoot.querySelector(".none")
    ? utterance.shadowRoot.querySelector(".none")
    : utterance.shadowRoot.querySelector(".message-stack");
  if (!messageStack) return null;
  const dfChips = messageStack.querySelector("df-chips");
  if (!dfChips || !dfChips.shadowRoot) return null;

  const chipsWrapper = dfChips.shadowRoot.querySelector(".df-chips-wrapper");
  if (!chipsWrapper) return null;

  return chipsWrapper.querySelector(".chip");
}

// Función para buscar y modificar el elemento
function searchAndModifyElement() {
  const dfMessengerBubble = document.querySelector("df-messenger-chat-bubble");

  if (dfMessengerBubble?.shadowRoot) {
    const shadowRoot = dfMessengerBubble.shadowRoot;
    const selector = ".chip"; // Cambiar el selector según lo necesites

    // Primer nivel de búsqueda, ajustado a la estructura mencionada
    const chipElement = shadowRoot
      .querySelector(".container")
      .querySelector(".chat-wrapper")
      .querySelector("#df-chat-wrapper")
      .shadowRoot.querySelector(".chat-wrapper")
      .querySelector(".message-list-wrapper")
      .querySelector("df-messenger-message-list")
      .shadowRoot.querySelector(".message-list-wrapper")
      .querySelector("#message-list")
      .querySelector(".content");

    // Realizar la búsqueda recursiva
    const foundElement = findElementInAnyShadowRoot(chipElement, selector);

    if (foundElement) {
      // Modificar la clase style .chip ya existente
      const styleElement = document.createElement("style");
      styleElement.textContent = `
        .chip {
          width: 38% !important;
          display: flex !important;
          justify-content: center !important;
        }
      `;
      foundElement.appendChild(styleElement);
    }
  }
}

// Función para manejar los temporizadores de sesión
function resetTimers(dfMessenger) {
  let warningTimeout, closeTimeout;

  // Resetear los temporizadores
  clearTimeout(warningTimeout);
  clearTimeout(closeTimeout);

  // Temporizador de advertencia
  warningTimeout = setTimeout(() => {
    console.log("Advertencia de cierre de sesión");

    dfMessenger.renderCustomText(
      "Su sesión está a punto de finalizar. Si necesita más asistencia, no dude en volver a contactarnos. ¡Gracias por su tiempo! 🤖✨",
      true
    );

    // Temporizador para cerrar la sesión
    closeTimeout = setTimeout(() => {
      dfMessenger.renderCustomText(
        "La sesión ha finalizado. Gracias por su tiempo. Si necesita más asistencia, estaremos encantados de ayudarle en una nueva sesión.",
        true
      );

      // Limpieza de la sesión y cierre del chat
      const dfMessengerBubble = document.querySelector(
        "df-messenger-chat-bubble"
      );
      dfMessengerBubble.closeChat();
      dfMessenger.clearStorage();
      dfMessenger.clearAuthentication();
      dfMessenger.startNewSession({ retainHistory: true });
      sessionStorage.removeItem("df-messenger-sessionID");
    }, 60000); // Muestra la advertencia tras 1 minuto de inactividad
  }, 60000); // Muestra la advertencia tras 1 minuto de inactividad
}

// Función principal para manejar la apertura del chat
function handleChatOpen(dfMessenger) {
  window.addEventListener("df-chat-open-changed", (event) => {
    if (event.detail.isOpen) {
      console.log("Chat abierto");
      const sessionId = sessionStorage.getItem("df-messenger-messages");

      if (!sessionId) {
        dfMessenger.renderCustomText(
          "Hola, bienvenido a Gob.sv. Estoy aquí para ayudarte con trámites, servicios e inquietudes sobre el Gobierno de El Salvador. 🤖✨",
          true
        );
        dfMessenger.renderCustomText(
          "Por favor, selecciona una de estas opciones para continuar: Simple Sv, Identidad Digital o Instituciones.",
          true
        );
        dfMessenger.sendRequest("query", "Hola");
      }
    }
  });
}

// Evento para reiniciar los temporizadores cuando se recibe una respuesta
function handleResponseReceived() {
  window.addEventListener("df-response-received", (event) => {
    // Resetear los temporizadores cuando se recibe una respuesta
    setTimeout(() => {
      searchAndModifyElement();
    }, 10);
    resetTimers();
  });
}

// Esperar a que se cargue el DOM
document.addEventListener("DOMContentLoaded", () => {
  const dfMessenger = document.querySelector("df-messenger");

  // Llamar a la búsqueda y modificación del elemento
  searchAndModifyElement();

  // Configurar los temporizadores
  let sessionId = sessionStorage.getItem("df-messenger-messages");
  if (sessionId) resetTimers(dfMessenger);

  // Manejar apertura del chat
  handleChatOpen(dfMessenger);

  // Manejar respuestas recibidas
  handleResponseReceived();
});
