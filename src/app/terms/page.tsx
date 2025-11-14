import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones - FlorAurora Salud",
  description:
    "Términos y condiciones de uso de la plataforma FlorAurora Salud",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            TÉRMINOS Y CONDICIONES
          </h1>

          <div className="prose prose-lg max-w-none">
            <div className="text-gray-700 leading-relaxed">
              <p className="mb-6">
                El presente instrumento establece los términos y condiciones
                generales que regulan el acceso y uso de los servicios ofrecidos
                por profesionales, a través de la plataforma FlorAurora Salud
                (en adelante, la &quot;Plataforma&quot;), administrada por
                RAKIDIUM SpA (en adelante, la &quot;Empresa&quot;). Al
                suscribirse, acceder y utilizar los servicios de la Plataforma,
                usted acepta cumplir con estos Términos y Condiciones en su
                totalidad. La Sociedad se reserva el derecho de modificar o
                actualizar estos Términos y Condiciones en cualquier momento.
                Cualquier cambio será notificado previamente a los usuarios a
                través de correo electrónico, proporcionando un plazo razonable
                para aceptar o rechazar las nuevas condiciones. Este plazo no
                superará, en ningún caso, los cinco días corridos, transcurrido
                este término, se entenderán irrevocablemente aceptadas las
                modificaciones.
              </p>
              <p className="mb-8 font-semibold">
                La aceptación de estos Términos y Condiciones es obligatoria
                para el uso de la Plataforma.
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  CLÁUSULA PRIMERA: Antecedentes y Funcionamiento de la
                  Plataforma
                </h2>
                <p className="mb-4">
                  RAKIDIUM SpA, identificada con el número de registro único
                  tributario 78.204.748-5, representada legalmente por JUAN JOSÉ
                  POBLETE GODOY, cédula de identidad número 13.900.291-1, ambos
                  con domicilio para estos fines en la comuna de Providencia,
                  Región Metropolitana, dispone de una plataforma digital en
                  línea que conecta a personas naturales que requieren servicios
                  psicológicos u de otras disciplinas del área de salud a
                  distancia (denominados «Consultantes») con profesionales de
                  estos campos de la salud, no excluyente, que ofrecen consultas
                  en línea (denominados «Profesionales»). El conjunto del sitio
                  web, la aplicación de FlorAurora Salud y los servicios, la
                  información y las comunicaciones conexas se designarán
                  conjuntamente como la «Plataforma».
                </p>

                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    1.1. Registro y Perfil del Consultante:
                  </h3>
                  <p className="mb-4">
                    Para concertar una sesión, el Consultante deberá crear un
                    perfil en el que proporcionará su información personal
                    completa (nombre completo, RUT, género, edad, dirección de
                    correo electrónico, número de teléfono y domicilio).
                    Posteriormente, seleccionará al profesional de su
                    preferencia para recibir atención a distancia y podrá elegir
                    el horario en función de la disponibilidad establecida. Es
                    posible agendar de forma predeterminada para el mismo día y
                    hora en semanas subsiguientes o bien seleccionar días y
                    horarios personalizados semanalmente.
                  </p>
                  <p className="mb-4">
                    En situaciones donde los Consultantes sean menores de edad,
                    la inscripción en la Plataforma será realizada por el adulto
                    responsable en representación del menor, indicando que la
                    atención se brindará a un individuo menor de edad.
                  </p>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    1.2. Información del Prestador:
                  </h3>
                  <p className="mb-2">
                    En el perfil del Prestador, el Consultante podrá acceder a
                    la siguiente información:
                  </p>
                  <ul className="list-disc list-inside ml-4 mb-4 space-y-1">
                    <li>País de procedencia del título profesional.</li>
                    <li>
                      Categorías terapéuticas según edad o composición (niños,
                      jóvenes, adultos, familias y/o parejas) en las cuales el
                      Profesional presta sus servicios.
                    </li>
                    <li>
                      Fechas y horarios disponibles para brindar dichos
                      servicios.
                    </li>
                    <li>Naturaleza de los servicios ofrecidos.</li>
                    <li>
                      Área de especialización. Esta información será visible
                      para el Consultante.
                    </li>
                  </ul>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    1.3. Confirmación y Pago:
                  </h3>
                  <p className="mb-4">
                    Tras efectuar el pago por la sesión, el Consultante recibirá
                    por correo electrónico los detalles del agendamiento, así
                    como el enlace para acceder a la sesión junto con la
                    información del Profesional seleccionado. Una vez realizada
                    la sesión, recibirá la boleta de honorarios respectiva por
                    los servicios prestados por el profesional.
                  </p>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    1.4. Duración:
                  </h3>
                  <p className="mb-4">
                    La duración máxima de la sesión será de 55 minutos.
                  </p>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    1.5. Evaluación:
                  </h3>
                  <p className="mb-4">
                    Finalizada la sesión, el Consultante podrá calificar su
                    experiencia y añadir comentarios adicionales sobre el
                    Profesional. El consultante podrá completar un formulario de
                    encuesta de servicio para estos efectos.
                  </p>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    1.6. Limitación de Servicios:
                  </h3>
                  <p className="mb-4">
                    La Empresa se reserva el derecho de no emitir informes ni
                    certificados relacionados con beneficios sociales, procesos
                    judiciales o procedimientos administrativos de cualquier
                    índole.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  CLÁUSULA SEGUNDA: Precio, Pago y Reembolsos
                </h2>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    2.1. Pago por Servicios:
                  </h3>
                  <p className="mb-4">
                    El Consultante se compromete a pagar el monto
                    correspondiente a los servicios contratados, expresado en
                    pesos chilenos y detallado en la Plataforma, solo después de
                    realizado el pago se confirmará la programación de la sesión
                    con el Profesional seleccionado. El importe a cancelar será
                    determinado conforme a la tarifa horaria establecida en el
                    perfil del Prestador.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    2.2. Transacción Monetaria:
                  </h3>
                  <p className="mb-4">
                    La transacción monetaria se realizará de acuerdo con las
                    instrucciones proporcionadas en la Plataforma. Una vez
                    realizada la sesión, el consultante recibirá una boleta de
                    honorarios correspondiente a los servicios prestados por el
                    profesional.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    2.3. Información Bancaria y Procesamiento de Pagos:
                  </h3>
                  <p className="mb-4">
                    Al aceptar los presentes Términos y Condiciones, el
                    Consultante consiente que RAKIDIUM SpA revele su información
                    bancaria a la entidad designada para el procesamiento de
                    pagos, y acepta los Términos y Condiciones inherentes a
                    dicho servicio de recaudación y abono.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    2.4. Reembolsos:
                  </h3>
                  <p className="mb-4">
                    El consultante solo tendrá derecho a reembolso cuando: 1)
                    decida cancelar la sesión agendada con, al menos, 24 horas
                    de anticipación; 2) el profesional no asista a la sesión
                    concertada; y 3) si la sesión no puede llevarse a efecto por
                    problemas técnicos de la plataforma.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    2.5. Reembolsos por ISAPRES y/o FONASA:
                  </h3>
                  <p className="mb-4">
                    Los programas ofrecidos en FlorAurora Salud pueden ser
                    elegibles para reembolso por parte de las ISAPRES. Sin
                    embargo, RAKIDIUM SpA no asume ninguna responsabilidad por
                    los acuerdos establecidos entre el Consultante y la entidad
                    prestadora, ni por las decisiones o resoluciones emitidas
                    por las ISAPRES. En ningún caso la Empresa realizará
                    reembolsos basados en decisiones o dictámenes de las
                    ISAPRES.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  CLAÚSULA TERCERA: Ejecución del Servicio
                </h2>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    3.1. Prestación del Servicio:
                  </h3>
                  <p className="mb-4">
                    La ejecución de los servicios por parte del Profesional se
                    llevará a cabo en la fecha y hora convenidas, una vez que se
                    haya verificado el correspondiente pago. La prestación del
                    servicio se considerará efectuada tras la conclusión de la
                    sesión.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    3.2. Ejecución del Servicio:
                  </h3>
                  <p className="mb-4">
                    La realización de las sesiones se efectúa conforme a lo
                    pactado, reconociéndose que la prestación del servicio se
                    brindará por profesionales con títulos emitidos en Chile o
                    en el extranjero, según lo exhibido en su perfil.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    3.3. Valoración del Trabajo:
                  </h3>
                  <p className="mb-4">
                    Una vez que el Profesional haya completado la prestación de
                    los servicios, el Consultante podrá evaluar su experiencia y
                    ofrecer comentarios adicionales sobre el profesional. Para
                    ello, se enviará por correo electrónico al Consultante un
                    cuestionario de encuesta de servicio, invitándolo a otorgar
                    una calificación en una escala de 1 a 5 mediante el uso de
                    «estrellas», y a proporcionar comentarios complementarios de
                    manera respetuosa y moderada en la Plataforma.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    3.4. Ausencia de Evaluación:
                  </h3>
                  <p className="mb-4">
                    Si el Consultante opta por no evaluar el trabajo, se
                    interpretará que la evaluación es positiva.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    3.5. Responsabilidad de RAKIDIUM SpA:
                  </h3>
                  <p className="mb-4">
                    La Empresa no asumirá responsabilidad alguna en relación con
                    la calidad de la sesión ni en lo que respecta al
                    comportamiento del Profesional durante la misma. La
                    Plataforma actúa únicamente como intermediaria en la
                    prestación de los servicios psicológicos (y de otras
                    disciplinas del área de salud) y no garantiza la calidad o
                    el desempeño del Profesional.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  CLAÚSULA CUARTA: Cancelaciones y Retrasos
                </h2>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    4.1. Cancelaciones por Parte del Consultante:
                  </h3>
                  <p className="mb-4">
                    El Consultante podrá cancelar o modificar la fecha y hora
                    establecida para la prestación del servicio a través de la
                    Plataforma, siempre que lo haga con una antelación mínima de
                    24 horas. No será posible realizar modificaciones en el
                    plazo de las 24 horas previas a la fecha y hora pactadas.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    4.2. Retrasos y No Comparecencia:
                  </h3>
                  <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
                    <li>
                      <strong>No Comparecencia del Profesional:</strong> En
                      casos en los que el Profesional no se presente en la fecha
                      y hora designada para la sesión de manera injustificada,
                      el Consultante tendrá derecho a solicitar el reembolso del
                      valor pagado por la sesión, o el reagendamiento de la
                      sesión.
                    </li>
                    <li>
                      <strong>Retrasos del Consultante:</strong> Si el
                      Consultante no comparece en la fecha y hora acordada,
                      perderá el derecho a la sesión, sin opción a reembolso, y
                      se considerará que la sesión se ha llevado a cabo.
                    </li>
                    <li>
                      <strong>Problemas técnicos de la Plataforma:</strong> Si
                      la sesión no puede llevarse a cabo por problemas de la
                      plataforma, el consultante podrá solicitar el reembolso
                      del valor de la sesión o su reagendamiento.
                    </li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  CLAÚSULA QUINTA: Obligaciones y Prohibiciones de los
                  Consultantes
                </h2>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    5.1. Prohibiciones Generales:
                  </h3>
                  <p className="mb-4">
                    Se encuentra expresamente prohibido a los Consultantes
                    utilizar los servicios de manera ilícita, inmoral,
                    perjudicial, amenazante, acosadora o de cualquier forma que
                    resulte objetable para FlorAurora Salud, la Empresa, los
                    Profesionales o terceros.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    5.2. Responsabilidades del Consultante:
                  </h3>
                  <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
                    <li>
                      <strong>Información:</strong> El Consultante debe
                      proporcionar información completa, veraz, actualizada y
                      precisa respecto a su identidad y al problema que motiva
                      la búsqueda de asesoramiento o los servicios del
                      Profesional. RAKIDIUM SpA no asume responsabilidad por los
                      perjuicios que el Consultante pueda sufrir como resultado
                      de errores propios en la gestión o ejecución del servicio,
                      incluyendo la provisión de información incorrecta que
                      impida la adecuada programación de la sesión o la falta de
                      comunicación de condiciones especiales relevantes para la
                      prestación del servicio.
                    </li>
                    <li>
                      <strong>Pago:</strong> El Consultante debe abonar el monto
                      acordado por los servicios y abstenerse de solicitar,
                      sugerir o insistir al Profesional sobre la posibilidad de
                      efectuar un pago directo fuera de la Plataforma. El
                      incumplimiento de esta obligación facultará a la Empresa a
                      expulsar al Consultante de la Plataforma, sin derecho a
                      ninguna clase de reembolso.
                    </li>
                    <li>
                      <strong>Uso Personal:</strong> Los servicios ofrecidos
                      mediante la Plataforma deben ser utilizados exclusivamente
                      con fines personales y no comerciales, a menos que
                      RAKIDIUM SpA otorgue su aprobación por escrito
                      previamente.
                    </li>
                    <li>
                      <strong>Acceso y Modificación:</strong> Está prohibido
                      utilizar medios automatizados o cualquier otro mecanismo
                      no autorizado para alterar, redirigir, acceder o emplear
                      los servicios proporcionados por la Plataforma, así como
                      realizar ingeniería inversa o intentar obtener el código
                      fuente de la misma, salvo que se cuente con la
                      autorización escrita previa de RAKIDIUM SpA.
                    </li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  CLÁUSULA SEXTA: Relación entre el Consultante y la Empresa
                </h2>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    6.1. Función de la Empresa:
                  </h3>
                  <p className="mb-4">
                    RAKIDIUM SpA actúa como entidad proveedora de una Plataforma
                    diseñada para centralizar y gestionar la información
                    relacionada con los servicios prestados por los
                    Profesionales. La Plataforma ofrece funcionalidades
                    integrales que incluyen la programación y administración de
                    horarios, el control de pagos, y la emisión de comprobantes
                    de servicios por parte del profesional, permitiendo que
                    todas estas acciones se realicen en un único entorno.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    6.2. Rol de Intermediario:
                  </h3>
                  <p className="mb-4">
                    En su relación con el Consultante, la Empresa actúa como
                    intermediario facilitador de información y gestión de pagos
                    a través de la Plataforma. RAKIDIUM SpA no asume ninguna
                    responsabilidad sobre la calidad de los servicios prestados
                    por los Profesionales ni sobre los resultados obtenidos.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    6.3. Decisión del Consultante:
                  </h3>
                  <p className="mb-4">
                    La decisión de continuar utilizando los servicios en línea
                    es responsabilidad exclusiva del Consultante. Esta decisión
                    debe basarse en su propia experiencia y evaluación de los
                    servicios proporcionados.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  CLAUSULA SÉPTIMA. Relación Contractual entre el Consultante y
                  la Empresa
                </h2>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    1. Relación Directa entre Consultante y Profesional:
                  </h3>
                  <p className="mb-4">
                    Al agendar una sesión con un Profesional a través de la
                    plataforma, el Consultante reconoce y acepta que está
                    estableciendo un contrato legalmente vinculante directamente
                    con el Profesional. RAKIDIUM SpA no forma parte de dicho
                    contrato, actuando únicamente como intermediario de la
                    información y facilitador de la plataforma.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    2. Relación entre Profesionales y La Empresa:
                  </h3>
                  <p className="mb-4">
                    RAKIDIUM SpA no es empleador, socio ni representante legal
                    de los Profesionales, ni de los Consultantes. La Empresa
                    proporciona una plataforma tecnológica para facilitar la
                    interacción y el pago de los servicios entre el Consultante
                    y el Profesional. Las partes reconocen que no existe ninguna
                    relación laboral, de sociedad, agencia o representación
                    entre ellas y la Empresa. No existe ningún vínculo de
                    subordinación ni dependencia.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    3. Limitación de Responsabilidad:
                  </h3>
                  <p className="mb-4">
                    La Empresa no asume responsabilidad alguna por las acciones,
                    omisiones o conductas del Profesional, ni garantiza la
                    calidad, puntualidad, legalidad o efectividad de los
                    servicios prestados. La Sociedad no monitorea ni controla
                    las interacciones o recomendaciones proporcionadas durante
                    las sesiones, y no será responsable por cualquier
                    consecuencia derivada de la relación entre el Consultante y
                    el Profesional.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    4. Prohibición de Representación:
                  </h3>
                  <p className="mb-4">
                    Ningún usuario, ya sea Profesional o Consultante, tiene la
                    autoridad para actuar en nombre de RAKIDIUM SpA o para
                    establecer compromisos que vinculen a la Empresa. Cualquier
                    intento de hacerlo será considerado nulo y sin efecto, sin
                    perjuicio de las responsabilidades que la Sociedad pueda
                    perseguir con causa de estos hechos.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    5. Autonomía de las Partes:
                  </h3>
                  <p className="mb-4">
                    La Empresa no interviene en la ejecución de los servicios,
                    ni participa en la gestión de los mismos. En consecuencia,
                    no se responsabiliza por la calidad, legalidad o legitimidad
                    de los servicios proporcionados por los Profesionales.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  CLAUSULA OCTAVA. Acuerdo de Nivel de Servicio
                </h2>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    1. Disponibilidad del Servicio:
                  </h3>
                  <p className="mb-4">
                    El Consultante reconoce y acepta que la Empresa no puede
                    garantizar la total disponibilidad de la Plataforma ni de
                    los servicios profesionales ofrecidos a través de
                    herramientas de comunicación como Google Meet u otras
                    plataformas similares. Estas herramientas pueden estar
                    sujetas a limitaciones, demoras u otros problemas inherentes
                    a su funcionamiento. En consecuencia, el Consultante conoce
                    y acepta que el servicio puede experimentar interrupciones,
                    disfunciones o retrasos debido a factores relacionados con
                    el uso de Internet y las comunicaciones electrónicas, que en
                    ningún caso podrán ser considerados como un incumplimiento
                    de la Plataforma.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    2. Responsabilidad del Consultante:
                  </h3>
                  <p className="mb-4">
                    Es responsabilidad del Consultante asegurarse de contar con
                    el hardware y software compatibles, así como con una
                    conexión a Internet de alta velocidad, que permitan un
                    acceso óptimo a la Plataforma y una comunicación fluida
                    durante las sesiones de terapia. La Empresa no será
                    responsable por problemas derivados de la falta de
                    compatibilidad o de una conexión deficiente por parte del
                    Consultante.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    3. Interrupciones del Servicio:
                  </h3>
                  <p className="mb-4">
                    La Empresa se reserva el derecho de llevar a cabo
                    interrupciones temporales del servicio para realizar tareas
                    de mantenimiento, actualizaciones o mejoras técnicas. En
                    estos casos, la Empresa se compromete a restablecer el
                    funcionamiento de la Plataforma con la mayor celeridad
                    posible. No obstante, el Consultante entiende que estas
                    acciones pueden depender de proveedores de servicios
                    externos, los cuales están fuera del control directo de la
                    Sociedad.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    4. Limitación de Responsabilidad:
                  </h3>
                  <p className="mb-4">
                    RAKIDIUM SpA no será responsable de ningún perjuicio o daño
                    que pueda resultar de las interrupciones, demoras o
                    disfunciones de la Plataforma, en la medida en que estas se
                    deban a causas fuera del control razonable de la Empresa,
                    incluyendo pero no limitándose a fallos técnicos, problemas
                    de red, interrupciones en los servicios de los proveedores,
                    o cualquier otra causa de fuerza mayor.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  CLAUSULA NOVENA. Limitación de Responsabilidad
                </h2>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    1. Exclusión de Responsabilidad:
                  </h3>
                  <p className="mb-4">
                    La Empresa, así como sus afiliados, socios, agentes,
                    directores, empleados, proveedores o licenciatarios, no
                    serán responsables en ningún caso por daños directos,
                    indirectos, imprevistos, lucro cesante, daño emergente,
                    incidental, especial o consecuencial, incluyendo daño moral,
                    que resulten de:
                  </p>
                  <ul className="list-disc list-inside ml-4 mb-4 space-y-1">
                    <li>
                      El uso o la imposibilidad de utilizar la Plataforma;
                    </li>
                    <li>
                      La provisión o falta de provisión de servicios
                      profesionales por parte de los Profesionales;
                    </li>
                    <li>
                      El rendimiento o la navegación en la Plataforma o en
                      enlaces a otros sitios web, incluso si la Empresa ha sido
                      informada de la posibilidad de tales daños;
                    </li>
                    <li>
                      Costos derivados de interrupciones del servicio, pérdida
                      de datos o recuperación de software, excepto en casos de
                      negligencia grave atribuible exclusivamente a la
                      Plataforma;
                    </li>
                    <li>
                      La calidad, idoneidad, o cumplimiento de los servicios
                      prestados por los Profesionales;
                    </li>
                    <li>
                      Cualquier negligencia médica, mala praxis o deficiente
                      prestación de servicios por parte de los Profesionales.
                    </li>
                  </ul>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    2. Circunstancias de Fuerza Mayor:
                  </h3>
                  <p className="mb-4">
                    La Empresa no será responsable por el incumplimiento de sus
                    obligaciones bajo estos Términos y Condiciones cuando dicho
                    incumplimiento sea causado por circunstancias fuera de su
                    control razonable, como hechos constitutivos de fuerza
                    mayor, casos fortuitos, huelgas, incendios, epidemias,
                    pandemias, u otras circunstancias similares que impidan o
                    retrasen la prestación de los servicios.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    3. Seguridad de la Información:
                  </h3>
                  <p className="mb-4">
                    En cuanto a la seguridad de la información,
                    confidencialidad, pérdida o alteración de datos, y acceso no
                    autorizado a los Servicios o cuentas de usuario, la
                    responsabilidad de la Empresa se limita a casos en los que
                    no haya cumplido con los procedimientos de seguridad
                    establecidos y cuando la falta sea atribuible exclusivamente
                    a RAKIDIUM SpA no será responsable por vulneraciones de
                    seguridad en servidores de terceros, ni por virus, malware u
                    otros elementos maliciosos transmitidos a través de dichos
                    servidores.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    4. Responsabilidad del Consultante y del Profesional:
                  </h3>
                  <p className="mb-4">
                    La asistencia a las sesiones y la calidad del servicio
                    recaen exclusivamente en la responsabilidad del Consultante
                    y del Profesional. La Empresa proporciona información sobre
                    los Profesionales para que los Consultantes puedan tomar
                    decisiones informadas. En casos de conductas graves o
                    delictivas por parte de los Profesionales, la empresa podrá
                    dar de baja al profesional de la Plataforma, sin asumir
                    responsabilidad adicional por sus acciones.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    5. Veracidad de la Información:
                  </h3>
                  <p className="mb-4">
                    RAKIDIUM SpA no garantiza la veracidad o autenticidad de la
                    información proporcionada por los Consultantes y/o
                    Profesionales al registrarse en la Plataforma. La Empresa no
                    asume responsabilidad por la integridad, competencia,
                    cualificaciones, ni por cualquier acción u omisión de los
                    usuarios de la Plataforma.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  CLAUSULA DÉCIMA. Tratamiento de Datos Personales
                </h2>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    1. Cumplimiento Normativo:
                  </h3>
                  <p className="mb-4">
                    El tratamiento de datos personales en la Plataforma se lleva
                    a cabo en estricto cumplimiento del artículo 19 Nº 4 de la
                    Constitución Política de la República de Chile, la Ley N°
                    19.628 sobre Protección de la Vida Privada, y cualquier otra
                    normativa legal aplicable que la complemente o sustituya. El
                    tratamiento de datos se regirá por los principios de
                    legalidad, finalidad, proporcionalidad, calidad,
                    responsabilidad, seguridad, transparencia, información,
                    confidencialidad y temporalidad.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    2. Recopilación y Uso de Datos del Consultante:
                  </h3>
                  <div className="mb-4">
                    <p className="mb-2">
                      <strong>Datos Recolectados:</strong> La Plataforma
                      recopila datos personales del Consultante que son
                      esenciales para la creación y gestión de su cuenta en la
                      Plataforma, incluyendo RUT, teléfono, nombre, apellido y
                      correo electrónico. Además, para facilitar la comunicación
                      con el Profesional, estos datos pueden ser utilizados para
                      el envío de recordatorios y otras comunicaciones
                      necesarias para la prestación de los servicios.
                    </p>
                    <p className="mb-2">
                      <strong>Compartición de Datos:</strong> Esta información
                      se comparte con el Profesional exclusivamente para la
                      prestación de sus servicios, quien se compromete a
                      mantener dicha información en estricta confidencialidad y
                      a no divulgarla a terceros sin el consentimiento del
                      Consultante.
                    </p>
                    <p className="mb-4">
                      <strong>Base Legal:</strong> La base legal para el
                      tratamiento de estos datos es el consentimiento otorgado
                      por el Consultante al suscribir este acuerdo, siendo
                      necesario para la ejecución del mismo.
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    3. Tratamiento de Datos Personales Sensibles:
                  </h3>
                  <div className="mb-4">
                    <p className="mb-2">
                      <strong>Datos Sensibles:</strong> Durante la prestación de
                      servicios, el Profesional puede recopilar datos personales
                      sensibles del Consultante, tales como historias clínicas,
                      diagnósticos, estado de salud, identificación de género, y
                      preferencias sexuales.
                    </p>
                    <p className="mb-2">
                      <strong>Responsabilidades:</strong> En este contexto, el
                      Profesional actúa como responsable del tratamiento de
                      estos datos, determinando los fines y medios para su
                      tratamiento, mientras que FlorAurora Salud actúa como
                      procesador, limitado a los fines establecidos en el
                      presente contrato.
                    </p>
                    <p className="mb-4">
                      <strong>Protección de Datos:</strong> La Empresa se
                      compromete a mantener estos datos sensibles en estricta
                      confidencialidad y a no compartirlos con terceros, excepto
                      con proveedores de servicios de alojamiento de datos,
                      quienes están obligados a proteger esta información bajo
                      los mismos estándares.
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    4. Derechos del Titular:
                  </h3>
                  <p className="mb-4">
                    El Consultante, como titular de los datos personales, tiene
                    derecho a ejercer sus derechos de acceso, rectificación,
                    cancelación u oposición (ARCO) conforme a la Ley N°19.628.
                    El Profesional se compromete a colaborar con la Empresa en
                    el ejercicio de estos derechos.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    5. Recopilación y Uso de Datos del Profesional:
                  </h3>
                  <div className="mb-4">
                    <p className="mb-2">
                      <strong>Datos Recolectados:</strong> FlorAurora Salud
                      recopila datos personales del Profesional necesarios para
                      la ejecución de este acuerdo, incluyendo nombre, apellido,
                      RUT, dirección, correo electrónico, número de teléfono,
                      datos bancarios, experiencia profesional, y la universidad
                      de donde obtuvo su título.
                    </p>
                    <p className="mb-4">
                      <strong>Base Legal:</strong> La base legal para el
                      tratamiento de estos datos es el consentimiento del/de la
                      Profesional, necesario para la ejecución del presente
                      acuerdo.
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    6. Medidas de Seguridad:
                  </h3>
                  <p className="mb-4">
                    La Empresa implementa y mantiene medidas técnicas,
                    organizativas y de seguridad adecuadas para proteger los
                    datos personales tratados en el contexto de la Plataforma.
                    Estas medidas están diseñadas para prevenir el acceso no
                    autorizado, alteración, pérdida o divulgación de los datos
                    personales.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
