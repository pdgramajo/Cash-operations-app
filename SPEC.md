# Especificación de Software: Sistema de Operaciones de Efectivo (Cash Operations System)

## 1. Título y Resumen Ejecutivo

**Título:** Sistema de Operaciones de Efectivo — Cash Operations System

**Versión del documento:** 1.0

**Fecha de elaboración:** 5 de mayo de 2026

**Resumen ejecutivo:**

El Sistema de Operaciones de Efectivo (Cash Operations System) es una aplicación web progresiva (PWA) diseñada para gestionar de manera integral las operaciones de efectivo en una carnicería o negocio de alimentos con múltiples sucursales. La aplicación permite controlar sesiones de caja, registrar transacciones comerciales (ventas, gastos, retiros), gestionar movimientos de inventario (entradas, salidas, transferencias), y generar reportes consolidados en formato PDF. El sistema funciona en modalidad offline-first, almacenando todos los datos localmente mediante IndexedDB, lo que garantiza continuidad operativa incluso sin conexión a internet. La interfaz de usuario está optimizada para dispositivos móviles, siguiendo principios de diseño responsive y accesibilidad.

**Propósito del documento:**

Este documento establece las especificaciones completas del sistema, sirviendo como referencia fundamental para el desarrollo, verificación de calidad, y mantenimiento futuro de la aplicación. Define todos los requisitos funcionales y no funcionales, las interfaces de usuario, el modelo de datos, los criterios de aceptación, el plan de pruebas, y las restricciones técnicas aplicables.

---

## 2. Alcance del Sistema

**2.1 Definición del producto**

El Cash Operations System es una aplicación web progresiva desarrollada con React, TypeScript y Vite, utilizando Dexie.js como base de datos local basada en IndexedDB. La aplicación está orientada a propietarios y empleados de carnicerías y negocios de alimentos que requieren un control detallado de sus operaciones de efectivo, inventario y ventas diarias.

**2.2 Objetivos del sistema**

Los objetivos principales del sistema son los siguientes: primero, proporcionar un mecanismo centralizado para el control de sesiones de caja en múltiples sucursales; segundo, registrar todas las transacciones comerciales con分类ación precisa por tipo y subtipo; tercero, gestionar los movimientos de inventario de mercadería con trazabilidad; cuarto, generar reportes detallados en formato PDF para análisis financiero; quinto, garantizar la disponibilidad de datos en entornos sin conectividad mediante almacenamiento local; y sexto, ofrecer una experiencia de usuario fluida en dispositivos móviles.

**2.3 Módulos y funcionalidades incluidos**

El sistema comprende seis módulos principales integrados en una única aplicación. El primer módulo es la gestión deSucursales, que permite crear, modificar y eliminar sucursales, cada una identificada por un nombre único y fecha de creación. El segundo módulo es la gestión de sesiones de efectivo, que soportacreate, abrir, cerrar, modificar y eliminar sesiones de caja, con cálculo automático del saldo estimado. El tercer módulo es el registro de transacciones, que permite registrar ventas en efectivo y por transferencia, gastos diversos, retiros de efectivo, y movimientos de ajuste. El cuarto módulo es la gestión de inventario, que controla entradas, salidas, transferencias entre sucursales, ajustes, productos dañados y devoluciones. El quinto módulo es la generación de reportes, que permite crear reportes por sesión individual, reportes diarios consolidados, y exportación a formato PDF. El sixth modulo is recepciones, que permite visualizar el historial de recepciones de mercadería filtrado por período y tipo.

**2.4 Limitaciones del alcance**

El sistema no contempla las siguientes funcionalidades fueradel alcance definido: integración con sistemas externos de facturación o contables; gestión de clientes o proveedores más allá de registros básicos; procesamiento de pagos con tarjetas de crédito o débito; gestión de empleados con controles de acceso individualizados; sincronización automática con servidores remotos; ni notificaciones push automáticas.

**2.5 Supuestos fundamentales**

Se asume que los usuarios tienen acceso a dispositivos con navegación web moderna y soporte para IndexedDB. Se asume un único usuario por dispositivo sin necesidad de autenticación multiusuario. Se asume que los datos se almacenan exclusivamente de forma local sin redundancia en la nube.

---

## 3. Requisitos Funcionales

**3.1 Gestión de Sucursales**

**RF-SUC-001: Crear sucursal.** El sistema debe permitir crear una nueva sucursal con un nombre único. Al crear una sucursal, se debe generar un identificador único automático mediante UUID, registrar la fecha y hora de creación, y almacenar el nombre proporcionado por el usuario. El sistema debe validar que el nombre no esté vacío y que no exista otra sucursal con el mismo nombre.

**RF-SUC-002: Listar sucursales.** El sistema debe mostrar una lista de todas las sucursales registradas, ordenadas por nombre alphabetically. Cada elemento debe mostrar el nombre de la sucursal.

**RF-SUC-003: Modificar sucursal.** El sistema debe permitir modificar el nombre de una sucursal existente. La validación debe prohibit nombres duplicados.

**RF-SUC-004: Eliminar sucursal.** El sistema debe permitir eliminar una sucursal, siempre que no esté asociada a sesiones activas o cerradas. En caso de existencia de sesiones asociadas, el sistema debe mostrar un mensaje de advertencia.

**3.2 Gestión de Sesiones de Efectivo**

**RF-SES-001: Crear sesión.** El sistema debe permitir abrir una nueva sesión de efectivo indicando: nombre de la sesión (obligatorio), sucursal asociada (opcional), saldo inicial de apertura (obligatorio, valor numérico mayor o igual a cero), y notas opcionales. Al crear, el sistema debe generar identificador único, registrar fecha y hora de apertura, y establecer el estado comoabierta.

**RF-SES-002: Listar sesiones abiertas.** El sistema debe mostrar todas las sesiones con estadoabierta, ordenadas cronológicamente por fecha de apertura (más recientes primero). Cada elemento debe mostrar: nombre, sucursal, fecha de apertura, saldo inicial, y estado visual diferenciadoparasesiones abiertas.

**RF-SES-003: Listar sesiones cerradas.** El sistema debe mostrar todas las sesiones con estadocerrado en una pestaña de historial, ordenadas cronológicamente por fecha de apertura (más recientes primero). Cada elemento debe mostrar: nombre, sucursal, fecha, saldo inicial, saldo de cierre, y acciones disponibles (exportar, eliminar).

**RF-SES-004: Consultar detalle de sesión.** Al seleccionar una sesión, el sistema debe navegar a la página de detalle mostrando: nombre completo, sucursal asignada, fecha y hora de apertura, saldo inicial ( editable para sesiones abiertas), transacciones registradas, movimientos de inventario, balance estimado en tiempo real, y botón de cerrar sesión para sesiones abiertas.

**RF-SES-005: Modificar saldo inicial.** Para sesionesabiertassolamente, el sistemadebepermitirmeditar el saldo inicial directamente desde la vista de detalle. El cambio debe guardarse inmediatamente al confirmar.

**RF-SES-006: Cerrar sesión.** El sistema debe permitir cerrar una sesión abierta proporcionando el saldo real de cierre. El sistema debe calcular y mostrar el saldo estimado como referencia antes de solicitar el ingreso manual. Al cerrar, se debe registrar la fecha y hora de cierre, establecer el estado comoocerradocon el saldo proporcionado, y actualizar la lista de sesionesabiertasarquiz abiertas.

**RF-SES-007: Exportar sesión.** Para sesionescerradas, el sistema debe permitir exportar todos los datos de una sesión (incluyendo transacciones asociadas y datos de la sucursal) a un archivo JSON. El archivo debe descargarse automáticamente en el dispositivo del usuario.

**RF-SES-008: Importar sesión.** El sistema debe permitir importar una sesión desde un archivo JSON válido. El proceso de importación debe: validar la estructura del archivo; crear una nueva sesión con identificador único; crear o reutilizar la sucursal asociada; e importar todas las transacciones no eliminadas.

**RF-SES-009: Eliminar sesión.** El sistema debe permitir eliminar una sesión (tantoabierta comocerrada) mostrando una confirmación antes de proceder. La eliminación debe ser permanente y sin posibilidad de recuperación.

**3.3 Registro de Transacciones**

**RF-TRA-001: Registrar venta en efectivo.** El sistema debe permitir registrar una venta pagada en efectivo indicando: monto (obligatorio, mayor a cero), y nota opcional. La transacción debe asociarse automáticamente a la sesión actual ya la sucursal correspondiente.

**RF-TRA-002: Registrar venta por transferencia.** El sistema debe permitir registrar una venta pagada por transferencia indicando: monto (obligatorio, mayor a cero), y nota opcional. El subtipo debe registrarse comotransfer.

**RF-TRA-003: Registrar gasto.** El sistema debe permitir registrar un gasto indicando: monto (obligatorio, mayor a cero), descripción (obligatoria), y nota opcional.

**RF-TRA-004: Registrar retiro de efectivo.** El sistemadebepermitirregistrar un retiro de efectivo indicando: monto (obligatorio, mayor a cero), tipo de destinatario (dueño, empleado, mensajero, proveedor, transferencia a sucursal, otro), nombre del destinatario (obligatorio excepto paralastransferencias a sucursal), y nota opcional.

**RF-TRA-005: Listar transacciones.** El sistema debe mostrar todas las transacciones de una sesión ordenadas cronológicamente (más recientes primero). Cada elemento debe mostrar: tipo de transacción formateado, monto con código de color (verde paralasventas efectivo, azul paralastransferencias, rojo paralagastos y retiros), y fecha y hora.

**RF-TRA-006: Filtrar transacciones.** El sistema debe permitir filtrar las transacciones por tipo: todas, ventas en efectivo, ventas por transferencia, o gastos. El filtro debe actualizar la vista en tiempo real mostrando el conteo de elementos paracada categoría.

**RF-TRA-007: Eliminar transacción.** Para sesionesabiertassolamente, el sistemadebepermitireliminar una transacción. La eliminación debe serlógica (soft-delete) marcandocamposDeleted comoverdadero. La transacción eliminada debe dejar de aparecer en loslistados y cálculos.

**RF-TRA-008: Calcular totales en tiempo real.** El sistema debe calcular y mostrar automáticamente: total de ventas en efectivo, total de ventas por transferencia, total de ventas (suma de ambas), y dinero estimado en caja (saldo inicial más ventas efectivo menos gastos menos retiros).

**RF-TRA-009: Mostrar montos rápidos.** Para ventas, el sistema debe mostrar botones de monto rápido basados en los montos más frecuentes del día anterior para esa sucursal, permitiendo un registro rápido con un solo toque.

**3.4 Gestión de Inventario**

**RF-INV-001: Registrar entrada de mercadería.** El sistemadebepermitir registrar una entrada de mercadería indicando: tipo de recepción (opcional, con autocompletado de tipos existentes), descripción (obligatoria), cantidad estimada (opcional), unidad (kg, unidades, media res, cuarto), y fecha y hora automática.

**RF-INV-002: Registrar salida de mercadería.** El sistema debe permitir registrar una salida de mercadería indicando: descripción (obligatoria), cantidad estimada (opcional), y unidad (opcional).

**RF-INV-003: Registrar transferencia de mercadería.** El sistema debe permitir registrar una transferencia entre sucursales indicando: descripción (obligatoria), sucursal destino (obligatoria), cantidad estimada (opcional), y unidad (opcional).

**RF-INV-004: Listar movimientos de inventario.** El sistema debe mostrar todos los movimientos de inventario de una sesión ordenados cronológicamente (más recientes primero). Cada elemento debe mostrar: tipo formateado, descripción, cantidad (si existe), unidad, sucursal destino (paratransferencias), y fecha y hora.

**RF-INV-005: Eliminar movimiento.** Parasesionesabiertassolamente, el sistemadebepermitireliminar un movimiento de inventario. La eliminación debe ser permanente.

**3.5 Generación de Reportes**

**RF-REP-001: Generar reporte por sesión.** El sistema debe permitir generar un reporte en formato PDF para una sesión cerrada específica. El reporte debe incluir: datos de la sesión, resumen de entradas (saldo inicial, ventas en efectivo, ventas por transferencia), resumen de salidas (gastos, retiros), saldo de cierre, y listado de movimientos de inventario.

**RF-REP-002: Generar reporte diario.** El sistema debe permitir generar un reporte diario consolidando múltiples sesiones. El usuario debe seleccionar una fecha y opcionalmente una sucursal. El reporte debe incluir: lista de sesiones del día, transacciones por sesión, totales consolidados, y movimientos de inventario del día.

**RF-REP-003: Descargar reporte PDF.** El sistema debe generar y descargar automáticamente el archivo PDF en el dispositivo del usuario con un nombre descriptivo basado en el tipo de reporte y la fecha.

**3.6 Gestión de Recepciones**

**RF-REC-001: Listar recepciones.** El sistema debe mostrar todas las entradas de mercadería (movimientos tipo incoming) filtradas por período. Los períodos disponibles deben ser: última semana (desde el lunes actual), último mes (desde el primer día del mes actual), y últimos 7 días.

**RF-REC-002: Filtrar recepciones por tipo.** El sistema debe permitir filtrar las recepciones por tipo de recepción, mostrando un conteo de elementos paracada tipo.

**RF-REC-003: Mostrar detalle de recepción.** Cada elemento de recepción debe mostrar: tipo de recepción (oSin tiposisin asignar), descripción, cantidad estimada, y fecha.

**3.7 Gestión de Interfaz de Usuario**

**RF-UI-001: Cambiar tema visual.** El sistema debe permitir alternar entre tema claro y tema oscuro. La preferencia debe persistir en el almacenamiento local del navegador.

**RF-UI-002: Navegación entre páginas.** El sistema debe proporcionar navegación fluida entre las distintas páginas mediante enlaces clearly visibles y accesibles.

**RF-UI-003: Indicadores de carga.** El sistema debe mostrar indicadores visuales durante la carga de datos asincrónicos para proporcionar retroalimentación al usuario.

**RF-UI-004: Mensajes de error.** El sistema debe mostrar mensajes de error claros cuando ocurran fallos en operaciones (guardado, importación, exportación, eliminación) o cuando los datos ingresados sean inválidos.

---

## 4. Requisitos No Funcionales

**4.1 Requisitos de Rendimiento**

**RNF-REND-001: Tiempo de carga inicial.** La aplicación debe cargar completamente en menos de 3 segundos bajo condiciones de red normales. El código debe estar optimizado parareducir el tamaño del bundle mediante técnicas como code-splitting y lazy-loading.

**RNF-REND-002: Respuesta de interfaz.** Las interacciones del usuario (clics, navegaciones) deben producir una respuesta visual inmediata (menos de 100 milisegundos). Las operaciones asincrónicas deben mostrar indicadores de progreso.

**RNF-REND-003: Consultas a base de datos.** Las consultas a IndexedDB deben completarse en menos de 500 milisegundos para conjuntos de datos de hasta 1000 registros. Para volúmenes mayores, se debe implementar paginación o carga diferida.

**RNF-REND-004: Generación de PDF.** La generación de archivos PDF debe completarse en menos de 5 segundos para reportes de hasta 10 sesiones consolidadas.

**4.2 Requisitos de Seguridad**

**RNF-SEG-001: Almacenamiento de datos.** Los datos deben almacenarse exclusivamente en el dispositivo del usuario mediante IndexedDB. No debe existir transmisión de datos a servidores externos.

**RNF-SEG-002: Validación de datos.** Toda entrada de usuario debe validarse en el lado del cliente antes de procesarse. Los valores numéricos deben restringirse a formatos válidos.

**RNF-SEG-003: Archivos importados.** Los archivos JSON importados deben validarse estructuralmente antes de procesarse para prevenir inyección de código malicioso.

**RNF-SEG-004: Control de acceso.** Dado que no existe autenticación, todos los usuarios del dispositivo tienen acceso completo a todas las funcionalidades. Esta restricción debe documentarse.

**4.3 Requisitos de Escalabilidad**

**RNF-ESC-001: Volumen de datos.** El sistema debe funcionar correctamente con hasta 10.000 sesiones, 100.000 transacciones y 50.000 movimientos de inventario almacenados localmente.

**RNF-ESC-002: Sucursales.** El sistema debe soportar hasta 20 sucursales sin degradación significativa de rendimiento.

**RNF-ESC-003: Transacciones por sesión.** Cada sesión debe poder registrar hasta 500 transacciones sin degradación de la interfaz.

**4.4 Requisitos de Usabilidad**

**RNF-USA-001: Diseño responsive.** La interfaz debe adaptarse a pantallas de diferentes tamaños, optimizada especialmente para dispositivos móviles con anchos de pantalla de 320 a 480 píxeles.

**RNF-USA-002: Accesibilidad.** Los elementos interactivos deben tener tamaños mínimos de 44x44 píxeles para facilitar eltoclean. Los colores deben cumplir una ratio de contraste mínima de 4.5:1.

**RNF-USA-003: Retroalimentación visual.** Toda acción del usuario debe producir retroalimentación visual immediate (cambios de estado, indicadores de carga, confirmaciones).

**RNF-USA-004: Formatos locales.** Todos los文本os, fechas y moneda deben formatearse según las convenciones locales argentinas (idioma español, formato de fecha DD/MM/AAAA, moneda ARS).

**RNF-USA-005: Theme toggle.** El sistema debe recordar la preferencia de tema del usuario entre sesiones.

**4.5 Requisitos de Disponibilidad**

**RNF-DISP-001: Mode Offline.** El sistema debe funcionar completamente sin conexión a internet, ya que todos los datos se almacenan localmente. La aplicación debe cargar desde el caché del service worker cuando no hay conectividad.

**RNF-DISP-002: Persistencia de datos.** Los datos deben persistir indefinidamente en el almacenamiento local del navegador hasta que el usuario los elimine explícitamente o borre los datos del sitio.

**4.6 Requisitos Tecnológicos**

**RNF-TEC-001: Navegadores compatibles.** La aplicación debe funcionar en Chrome (versión 90+), Firefox (versión 88+), Safari (versión 14+), y Edge (versión 90+).

**RNF-TEC-002: IndexedDB.** El sistema debe utilizar IndexedDB mediante la biblioteca Dexie.js para el almacenamiento de datos. Se debe configurar un manejo adecuado de versiones de la base de datos.

**RNF-TEC-003: PWA.** La aplicación debe cumplir con los requisitos básicos de Progressive Web App: manifest.json válido, service worker para caché, y meta标签para allow instalación.

**RNF-TEC-004: Base path.** Dado que la aplicación se sirve desde un subdirectorio, todas las rutas y navegación deben considerar el base path /Cash-operations-app/.

---

## 5. Interfaces de Usuario

**5.1 Estructura de Navegación**

La aplicación utiliza React Router con lazy-loading para la navegación entre páginas. El router está configurado con el basename /Cash-operations-app/ para correcto fonctionnement en el subdirectorio de despliegue.

Las rutas definidas son las siguientes: / (raíz) carga SessionsPage, /session/:sessionId carga SessionPage, /reports carga ReportsPage, y /receipts carga ReceiptsPage.

**5.2 Página de Sesiones (SessionsPage)**

Esta página constituye el punto de entrada principal de la aplicación. Su diseño es el siguiente:

El encabezado contiene un grupo de botones de navegación(global: tema claro/oscuro, Reportes, Recepciones, Importar)y un botón principal destacado para crear una nueva sesión.

Las sesionesabiertasse muestran en una sección destacada encima detodaslasdemas, visualmente diferenciada con un indicador de estado verde y la etiquetaAbierta. Cada tarjeta de sesión muestra: nombre de la sesión, nombre de la sucursal más fecha y hora de apertura, saldo inicial, y al hacer clicnavega al detalle.

Las sesionescerradas se muestran en una pestaña labeled Historial. El contenido presenta un scroll vertical con tarjetas de sesión cerradas. Cada tarjeta muestra: nombre, sucursal, fecha, saldo inicial, saldo de cierre, y botones de acciones (exportarcomoicono de subir, eliminar como icono de papelera). Al hacer clic en una tarjeta se navega al detalle.

Los diálogos modales se utilizanpara: crear nueva sesión (NewSessionDialog), confirmar eliminación (AlertDialog), confirmar exportación (AlertDialog), e importar sesión (Dialog con preview de datos).

**5.3 Página de Detalle de Sesión (SessionPage)**

Esta página muestra el detalle completo de una sesión específica. Su diseño es el siguiente:

El encabezado contiene un botón de retorno a la página principal, el nombre de la sesión como título, datos de sucursal y fecha, saldo inicial (mostrado como enlace editable пара session sabiertassolamente), y para sesionesabiertassolamente, un botón para cerrar sesión.

Las tarjetas de resumen financiero muestran cuatro tarjetas en una grilla de 2x2: Efectivo (ventas en efectivo), Transferencias, Total Ventas, y Dinero en Caja.

Los botones deacción para sesionesabiertasmuestrantres botones de acción rápida: Venta, Gasto, Retiro.

Los tabs de contenido contienen dos pestañas: Movimientos (que muestra el listado de transacciones) e Inventario (que muestra el listado de movimientos de inventario).

En la pestaña de transacciones, existe una barra de filtros: Todos, Efectivo, Transfer, Gastos. Cada transacción se muestra como una tarjeta con tipo, monto (codificado por colores), y botón de eliminar (para sesionesabiertassolamente).

En la pestaña de inventario, existen botones de acción paradossession sabiertassolamente: Entrada, Salida, Transferir. Cada movimiento se muestra como una tarjeta con descripción, cantidad (si existe), tipo, y botón de eliminar (para sesionesabiertassolamente).

Los diálogos modales incluyen: TransactionDialog (dinámico según tipo: venta, gasto, retiro), MovementDialog (dinámico según tipo: entrada, salida, transferencia), y CloseSessionDialog.

**5.4 Página de Reportes (ReportsPage)**

Esta página permite generar reportes en formato PDF. Su diseño es el siguiente:

El encabezado contiene un botón de retorno, el título Reportes, y un subtítulo descriptivo.

Los tabs de contenido muestran dos pestañas: Por Sesión y Diario.

En la pestaña Por Sesión, se muestra un listado scrollable de sesionescerradas disponibles. Al hacer clic en una sesión, se genera y descarga el reporte inmediatamente.

En la pestaña Diario, se muestran campos de formulario:Fecha (input date), Sucursal (select optional), y botón para descargar reporte. Al hacer clic, se genera el reporte con las sesiones de la fecha seleccionada.

Los diálogos de descarga utilizan un indicador de progreso mientras se genera el PDF.

**5.5 Página de Recepciones (ReceiptsPage)**

Esta página muestra el historial de recepciones de mercadería. Su diseño es el siguiente:

El encabezado contiene un botón de retorno, el título Recepciones,y un subtítulo que indica el filtro de tiempo activo.

Los botones de tiempo muestran tres opciones:Semana, Mes,7 días. El botón activo селеccіonadose muestra con estilo destacado.

Los botones de filtro por tipo muestran un botón paraTodos, un botón paraOtros (recepciones sin tipo asignado),y un botón paracaadatipoderegistro existente. Cada botón muestra el conteo de elementos.

El listado de recepciones se muestra en un scroll vertical. Cada tarjeta muestra: tipo de recepción (oSin tiposisin tipo), descripción, y fecha.

**5.6 Componentes UI Reutilizables**

El sistema utiliza componentes de shadcn/ui adaptados para Tailwind v4. Los componentes utilizados incluyen: Card, CardContent, CardDescription, CardHeader, CardTitle; Button con variantes outline, ghost, default, sizes sm/icon; Input (number, text, file); Select, SelectContent, SelectItem, SelectTrigger, SelectValue; Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle; AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle; Tabs, TabsContent, TabsList, TabsTrigger; ScrollArea; Label.

**5.7 Implementación de Formularios**

Todos los formularios siguen un patron consistente: validación de campos obligatorios antes del envío, indicadores de carga durante operaciones asincrónicas, reset del formulario después de un envío exitoso, y cierre automático del diálogo después del éxito.

---

## 6. Modelo de Datos

**6.1 Esquema de la Base de Datos**

La base de datos se implementa mediante Dexie.js con el nombre cashOperationsDB. La versión 1 define los indexes iniciales: branches (id, name, createdAt), cashSessions (id, branchId, status, openedAt, closedAt), transactions (id, sessionId, branchId, type, createdAt, isDeleted), inventoryMovements (id, sessionId, branchId, type, createdAt), reports (id, type, createdAt, branchId). La versión 2 agrega la tabla receiptTypes (id, name, createdAt).

**6.2 Entidad: Branch (Sucursal)**

La entidad Branch representa una sucursal del negocio. Sus campos son: id (string, UUID, clave primaria), name (string, nombre de la sucursal), y createdAt (Date, fecha de creación).

**6.3 Entidad: CashSession (Sesión de Efectivo)**

La entidad CashSession representa una sesión de caja. Sus campos son: id (string, UUID, clave primaria), name (string, nombre de la sesión), branchId (string | null, referencia a Branch), openedAt (Date, fecha de apertura), closedAt (Date | null, fecha de cierre), openingBalance (number, saldo inicial), closingBalance (number | null, saldo de cierre), status (SessionStatus, estado de la sesión), y notes (string | null, notas adicionales). El tipo SessionStatus es'un' | 'closed'.

**6.4 Entidad: Transaction (Transacción)**

La entidad Transaction representa una transacción comercial. Sus campos son: id (string, UUID, clave primaria), sessionId (string, referencia a CashSession), branchId (string | null, referencia a Branch), type (TransactionType, tipo de transacción), subType (TransactionSubType | undefined, subtipo), amount (number, monto), note (string | null, nota opcional), recipientType (RecipientType | undefined, tipo de destinatario), recipientName (string | undefined, nombre del destinatario), createdAt (Date, fecha de creación), y isDeleted (boolean, marca de eliminación lógica). Los tipos válidos de TransactionType son: 'sale' | 'expense' | 'cash_withdrawal' | 'opening_balance' | 'refund' | 'adjustment'. TransactionSubType es: 'cash' | 'transfer'. RecipientTypees: 'owner' | 'employee' | 'messenger' | 'supplier' | 'branch_transfer' | 'other'.

**6.5 Entidad: InventoryMovement (Movimiento de Inventario)**

La entidad InventoryMovement representa un movimiento de inventario. Sus campos son: id (string, UUID, clave primaria), sessionId (string, referencia a CashSession), branchId (string | null, referencia a Branch), type (InventoryMovementType, tipo de movimiento), description (string, descripción), receiptType (string | undefined, tipo de recepción), estimatedQuantity (number | undefined, cantidad estimada), unit (MovementUnit | undefined, unidad de medida), targetBranchId (string | undefined, sucursal destino), y createdAt (Date, fecha de creación). InventoryMovementTypees: 'incoming' | 'outgoing' | 'transfer' | 'adjustment' | 'damaged' | 'return'. MovementUnityes: 'kg' | 'unit' | 'half' | 'quarter'.

**6.6 Entidad: ReceiptType (Tipo de Recepción)**

La entidad ReceiptType representa un tipo de recepción de mercadería. Sus campos son: id (string, UUID, clave primaria), name (string, nombre del tipo), y createdAt (Date, fecha de creación).

**6.7 Entidad: Report (Reporte)**

La entidad Report representa un reporte generado. Sus campos son: id (string, UUID, clave primaria), createdAt (Date, fecha de creación), type (ReportType, tipo de reporte), sessionIds (string[], referencias a sesiones), dateFrom (Date | null, fecha inicial), dateTo (Date | null, fecha final), branchId (string | null, referencia a Branch), y fileName (string, nombre del archivo). ReportTypees: 'session' | 'daily' | 'custom' | 'range'.

**6.8 Entidades de Agregación**

SessionSummary es una estructura de lectura que consolida información de una sesión para presentación. Sus campos son: sessionId, sessionName, branchName, openingBalance, closingBalance, cashSales, transferSales, totalSales, expenses, withdrawals, transactions, y movements.

DailySummary es una estructura de lectura que consolida información diaria. Sus campos son: date, branchName, sessions (array de SessionSummary), totalCash, totalTransfers, totalSales, totalExpenses, totalWithdrawals, y totalInternalMovements.

**6.9 Repositorios de Acceso a Datos**

El sistema implementa un patrón de repositorio para el acceso a datos. Los repositorios definidos son: branchRepository (crear, obtener todos, obtener por id, actualizar, eliminar), cashSessionRepository (crear, obtener todos, obtener por id, abrir, cerrar, actualizar, eliminar), transactionRepository (crear, obtener por sesión, obtener por rango de fechas, soft-delete), inventoryMovementRepository (crear, obtener por sesión, obtener entradspor rango de fechas, eliminar), receiptTypeRepository (crear, obtenir todos), y reportRepository (crear, obtenir todos).

---

## 7. Criterios de Aceptación

**7.1 Criterios de Aceptación Generales**

Para que el sistema sea aceptado, debe cumplir con los siguientes criterios generales: la aplicación debe cargar sin errores en la consola del navegador; todas las rutas definidas deben funcionar correctamente considerando el base path; el tema claro y oscuro deben aplicarse consistentemente en todos los componentes; los datos deben persistir correctamente después de cerrar y reopen el navegador.

**7.2 Criterios de Gestión de Sucursales**

CA-SUC-001: Después de crear una sucursal, debe aparecer inmediatamente en el listado sin necesidad de recargar la página.

CA-SUC-002: No debe ser posible crear dos sucursales con el mismo nombre. El sistema debe mostrar un mensaje de error claro.

CA-SUC-003: Cuando se elimina una sucursal asociada a sesiones, debe mostrarse un mensaje de advertencia.

**7.3 Criterios de Gestión de Sesiones**

CA-SES-001: Al crear una nueva sesiónabierta, debe aparecer en la sección desesionesabriertas con estadovisual distinto.

CA-SES-002: Al hacer clic en una sesiónabierta, debe navegarse a la página de detallesinmediatamente.

CA-SES-003: El saldo estimado en caja debe actualizarse en tiempo real al agregar transacciones.

CA-SES-004: Al cerrar una sesión, el saldo de cierre proporcionado debe guardarse correctamente, y la sesión debe aparecer en el historialcerrado.

CA-SES-005: El archivo JSON exportado debe contener todos los datos necesarios para importar la sesión en otro dispositivo.

CA-SES-006: Al importar un archivo JSON válido, todos los datos deben importarse correctamente, incluyendo transacciones asociadas.

**7.4 Criterios de Transacciones**

CA-TRA-001: Al registrar una venta, debe aparecer inmediatamente en el listado de transacciones de la sesión.

CA-TRA-002: Los filtros deben mostrar el conteo correcto de elementos paracada categoría.

CA-TRA-003: Los montos rapidos deben mostrar valores relevantes basados en el historial.

CA-TRA-004: Al eliminar una transacción, debe dejar de aparecer en los cálculos y listados.

CA-TRA-005: Los totales deben calcularse correctamente considerando solo las transacciones no eliminadas.

**7.5 Criterios de Inventario**

CA-INV-001: Al registrar una transferencia, el campo de sucursal destino debe mostrar obligatoriamente un selector con las sucursales disponibles.

CA-INV-002: Los movimientos de inventario deben aparecer en el listado correspondiente de la sesión.

**7.6 Criterios de Reportes**

CA-REP-001: El reporte por sesión debe generar un PDF con todos los datos relevantes de la sesión.

CA-REP-002: El reporte diario debe consolidar correctamente los datos de múltiples sesiones de la misma fecha.

CA-REP-003: El PDF debe descargarse automáticamente con un nombre de archivo descriptivo.

**7.7 Criterios de Recepciones**

CA-REC-001: El filtro de tiempo debe actualizar el listado correctamente según el período seleccionado.

CA-REC-002: Los filtros por tipo deben mostrar el conteo correcto de elementos.

**7.8 Criterios de Interfaz**

CA-UI-001: Al cambiar de tema, la preferencia debe persistir después de recargar la página.

CA-UI-002: Los mensajes de error deben ser claros y descriptivos.

CA-UI-003: Los indicadores de carga deben mostrarse durante todas las operaciones asincrónicas.

---

## 8. Plan de Pruebas

**8.1 Estrategia de Pruebas**

El sistema utiliza Vitest con jsdom environment para ejecutar pruebas unitarias y de integración. Las pruebas deben seguir el patrón AAA (Arrange, Act, Assert) y utilizar @testing-library/react para pruebas de componentes.

**8.2 Pruebas Unitarias de Hooks**

Las pruebas de hook deben verificar el comportamiento del estado interno y las llamadas al repositorio.

useCashSessions.test.ts debe probar: carga inicial de sesiones, creación de nueva sesión, cierre de sesión, actualización de sesión, y eliminación de sesión.

useTransactions.test.ts debe probar: carga de transacciones por sesión, creación de transacción, eliminación de transacción (soft-delete), y cálculo de totales.

useInventoryMovements.test.ts debe probar: carga de movimientos por sesión, creación de movimiento, y eliminación de movimiento.

useBranches.test.ts debe probar: carga de sucursales, creación de sucursal, y eliminación de sucursal.

**8.3 Pruebas de Componentes**

SessionsPage.test.tsx debe probar: renderizado correcto del listado desesionesabiertasycerradas, apertura del diálogo de nueva sesión, apertura del diálogo de eliminación, y apertura del diálogo de exportación.

SessionPage.test.tsx debe probar: renderizado de detalles de sesión, apertura de diálogos de transacción y movimiento, y renderizado de transacciones y movimientos filtrados.

NewSessionDialog.test.tsx debe probar: validación de campos obligatorios, creación de sesión con sucursal nueva, y creación de sesión sin sucursal.

**8.4 Pruebas de Servicios**

exportService.test.ts debe probar: generación del objeto de exportación, descarga de archivo, y parsing del archivo exportado.

importService.test.ts debe probar: importación exitosa, manejo de errores de estructura inválida, y creación o reutilización de sucursal.

reportService.test.ts debe probar: generación de reporte por sesión y generación de reporte diario.

**8.5 Pruebas de Integración**

formatters.test.ts debe probar: formateo de moneda, formateo de fecha, formateo de fecha-hora, y obtención de etiquetas.

sessionCalculations.test.ts debe probar: cálculo de totals paravariostipos de transacción.

**8.6 Cobertura de Pruebas Objetivo**

La cobertura de código objetivo es: mínimo 70% de cobertura para lógica de negocio (hooks, servicios, repositorios), y pruebas funcionalesparatodaslaspages principales.

**8.7 Ejecución de Pruebas**

Las pruebas se ejecutan mediante el comando pnpm test. El archivo de configuración es vitest.config.ts, configurado con jsdom environment y globals true.

---

## 9. Supuestos y Restricciones

**9.1 Supuestos del Entorno**

Se asume que los usuarios utilizan dispositivos con navegación compatible con ES2020 o superior. Se asume que el almacenamiento local del navegador está disponible y no está siendo limpiado frecuentemente por políticas corporativas. Se asume que el servicio deDexie.js está disponible y funcionando correctamente.

**9.2 Restricciones de Diseño**

El sistema está diseñado para un único usuario por dispositivo sin autenticación. No existe mecanismo de respaldo automático de datos; el usuario debe exportar manualmente si necesita respaldar. No existe sincronización entre dispositivos; los datos son locales a cada dispositivo.

**9.3 Restricciones Técnicas**

El almacenamiento en IndexedDB tiene límites que varían según el navegador, generalmente entre 50MB y cientos deMB por origen. La aplicación no debe almacenar archivos grandes (imágenes, documentos) en la base de datos. Los reportes PDF generados no deben exceder las capacidades de memoria del dispositivo.

**9.4 Restricciones de Funcionalidad**

El sistema no valida la consistencia matemática entre el saldo de cierre y el flujo de transacciones; esta validación queda a criterio del usuario al cerrar la sesión. El sistema no implementa controles de inventario persistentes; solo registra movimientos sin mantener un stock actualizado.

**9.5 Consideraciones de Mantenimiento**

Al modificar el esquema de la base de datos (versiones Dexie), debe implementarse la migración correspondiente. Al agregar nuevas entidades, deben crearse los repositorios y hooks correspondientes. Cualquier cambio en los paths debe considerar el base path /Cash-operations-app/.

---

## 10. Glosario de Términos

**Base path:** Ruta base de la aplicación en el servidor web. Para esta aplicación, /Cash-operations-app/.

**Branch (Sucursal):** Unidad de negocio física o conceptual asociada a una sesión de caja. Puede ser una carnicería específica o una unidad sin sucursal asignada.

**Cash Session (Sesión de Efectivo):** Período de operación de caja que comienza con un saldo inicial y termina con un saldo de cierre. Puede estarabierta(o cerrrada).

**Dexie.js:** Biblioteca de terceros que simplifica la interacción con IndexedDB ofreciendo una API basada en promesas.

**Exportación (JSON):** Proceso de generar un archivo JSON con todos los datos de una sesión para respaldo o transferencia a otro dispositivo.

**Importación (JSON):** Proceso de leer un archivo JSON y crear una nueva sesión con los datos contenidos.

**IndexedDB:** Base de datos NoSQL embeida en el navegador web para almacenamiento local de grandes cantidades de datos estructurados.

**Inventario (movimientos):** Registro de entradas, salidas, transferencias y otros movimientos de mercadería dentro de una sesión.

**Offline-first:** Arquitectura que prioriza el funcionamiento sin conexión a internet, almacenando todos los datos localmente.

**PWA (Progressive Web App):** Aplicación web que utiliza tecnologías web modernas para ofrecer una experiencia similar a una aplicación nativa, incluyendo capacidad de instalación y funcionamiento offline.

**Reporte diario:** Reporte PDF que consolida los datos de múltiples sesiones de una misma fecha.

**Reporte por sesión:** Reporte PDF generado para una sesión específica individualmente.

**SessionStatus:** Estado de una sesión de efectivo: 'open' (abierta) o 'closed' (cerrada).

**Soft-delete:** Patrón de eliminación en el que el registro se marca como eliminado en lugar de removerse físicamente de la base de datos.

**Sucursal (Branch):** Ver Branch.

**Tailwind v4:** Versión 4 del framework de CSS Tailwind CSS, que utiliza un plugin específico para Vite.

**Transacción (Transaction):** Registro de una operación comercial (venta, gasto, retiro) dentro de una sesión de efectivo.

**UUID (Identificador Único Universal):** Identificador único generado algoritmicamente para garantizar unicidad global.

---

_Fin del documento._
