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
            Términos y Condiciones
          </h1>

          <div className="prose prose-lg max-w-none">
            <div className="text-gray-700 leading-relaxed">
              <p className="mb-6">
                El presente instrumento establece los términos y condiciones
                generales que regulan el acceso y uso de los servicios ofrecidos
                por profesionales, a través de la plataforma FlorAurora Salud
                (en adelante, la &quot;Plataforma&quot;), administrada RAKIDIUM SpA (en
                adelante, la &quot;Empresa&quot;). Al suscribirse, acceder y utilizar los
                servicios de la Plataforma, usted acepta cumplir con estos
                Términos y Condiciones en su totalidad. La Sociedad se reserva
                el derecho de modificar o actualizar estos Términos y
                Condiciones en cualquier momento. Cualquier cambio será
                notificado previamente a los usuarios, a través de correo
                electrónico, proporcionando un plazo razonable para aceptar o
                rechazar las nuevas condiciones. Este plazo no superará, en
                ningún caso, los cinco días corridos, transcurrido este término,
                se entenderán irrevocablemente aceptadas las modificaciones.
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
                  de psicología u de otras disciplinas del área de salud a
                  distancia (denominados «Consultantes») con profesionales de
                  estos campos de la salud (denominados «Profesionales»), no
                  excluyente, que ofrecen consultas en línea. El conjunto del
                  sitio web, la aplicación de FlorAurora y los servicios, la
                  información y las comunicaciones conexas se designarán
                  conjuntamente como la «Plataforma».
                </p>

                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    1.1. Registro y Perfil del Profesional:
                  </h3>
                  <p className="mb-4">
                    Para poder prestar servicios en la plataforma, el
                    Profesional deberá crear un perfil en el que proporcionará
                    su información personal completa (nombre completo, RUT,
                    género, edad, dirección de correo electrónico, número de
                    teléfono y domicilio), así como expresar su área de
                    especialidad, adjuntar su título profesional y su Número de
                    Registro de la Superintendencia de Salud. La Plataforma
                    revisará el cumplimiento de todos estos requisitos y validez
                    del título, reservándose el derecho a rechazar la solicitud
                    del profesional por incumplimiento de alguno de estos. Una
                    vez validado su perfil, podrá ser visualizado en la
                    Plataforma y agendar horas de atención.
                  </p>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    1.2. Modalidades del Servicio:
                  </h3>
                  <p className="mb-4">
                    El Profesional podrá optar entre dos modalidades para
                    prestar servicios en la Plataforma: 1) un plan de treinta
                    días (o &quot;Plan Mensual&quot;), en que realizará un pago único por
                    el valor anunciado en la plataforma, que lo habilitará para
                    prestar las atenciones que estime durante el período
                    contratado, sin posibilidad de reembolso por no uso o
                    cualquier otra causa; y 2) atención por comisión (o &quot;Plan
                    Light&quot;), en que la Plataforma descontará un porcentaje fijo
                    equivalente al 10% del valor convenido por cada sesión que
                    realice el Profesional, el cual deberá encontrarse dentro de
                    lo valores mínimos y máximos autorizados por la plataforma,
                    esto es, desde los $25.000 a los $50.000 pesos. El
                    Profesional podrá cambiar de modalidad con libertad. En
                    ambos casos, la duración máxima de cada sesión no podrá
                    superar los 55 minutos.
                  </p>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    1.3. Plan Mensual:
                  </h3>
                  <p className="mb-2">
                    La contratación del plan mensual dará acceso al Profesional
                    a las siguientes funciones:
                  </p>
                  <ul className="list-disc list-inside ml-4 mb-4 space-y-1">
                    <li>Agendamiento online de sesiones.</li>
                    <li>
                      Aviso automático de confirmación y recordatorio de sesión,
                      vía correo electrónico.
                    </li>
                    <li>Ficha virtual del paciente.</li>
                    <li>
                      Emisión automática de boleta de honorarios ante el
                      Servicio de Impuestos Internos, previo ingreso de datos y
                      autorización del profesional.
                    </li>
                    <li>
                      Visualización del profesional en la página principal de la
                      plataforma.
                    </li>
                    <li>
                      Realización de las sesiones convenidas mediante
                      videollamada del servicio &quot;Google Meet&quot;.
                    </li>
                    <li>
                      Recepción de pagos de los pacientes, los cuales se
                      transferirán a los profesionales el segundo día hábil de
                      la semana inmediatamente siguiente a la fecha de
                      realización de la sesión.
                    </li>
                  </ul>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    1.4. Plan Light:
                  </h3>
                  <p className="mb-2">
                    La contratación del plan light dará acceso al profesional a
                    las siguientes funciones:
                  </p>
                  <ul className="list-disc list-inside ml-4 mb-4 space-y-1">
                    <li>Agendamiento online de sesiones.</li>
                    <li>Ficha virtual del paciente.</li>
                    <li>
                      Emisión automática de boleta de honorarios ante el
                      Servicio de Impuestos Internos, previo ingreso de datos y
                      autorización del profesional.
                    </li>
                    <li>
                      Realización de las sesiones convenidas mediante
                      videollamada del servicio &quot;Google Meet&quot;.
                    </li>
                    <li>
                      Recepción de pagos de los pacientes, los cuales se
                      transferirán a los profesionales el segundo día hábil de
                      la semana inmediatamente siguiente a la fecha de
                      realización de la sesión.
                    </li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  CLAÚSULA SEGUNDA: Relación entre el Profesional y la Empresa
                </h2>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    2.1. Función de la Empresa:
                  </h3>
                  <p className="mb-4">
                    RAKIDIUM SpA actúa como entidad proveedora de una Plataforma
                    diseñada para centralizar y gestionar la información para la
                    prestación de servicios por el Profesional, de acuerdo a los
                    términos expuestos en los puntos 1.2 al 1.4 de la cláusula
                    anterior.
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    2.2. Rol de Intermediario:
                  </h3>
                  <p className="mb-4">
                    En su relación con el Profesional, la Plataforma actúa como
                    intermediario facilitador de las funciones respectivas al
                    plan contratado por el profesional, de acuerdo a los
                    términos expuestos en la cláusula precedente. RAKIDIUM SpA
                    no asume ninguna responsabilidad sobre la calidad de los
                    servicios prestados, ni sobre los resultados obtenidos.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  CLAUSULA TERCERA. Relación Contractual
                </h2>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    1. Relación Directa entre Consultante y Profesional:
                  </h3>
                  <p className="mb-4">
                    Al agendar una sesión con un Profesional a través de la
                    plataforma, el Profesional reconoce y acepta que está
                    estableciendo un contrato legalmente vinculante directamente
                    con el Consultante. RAKIDIUM SpA no forma parte de dicho
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
                  CLAUSULA CUARTA. Limitación de Responsabilidad
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
                      negligencia grave atribuible exclusivamente a la Sociedad;
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
                    obligaciones bajo estos Términos y Condiciones, cuando dicho
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
                    a la Sociedad. RAKIDIUM SpA no será responsable por
                    vulneraciones de seguridad en servidores de terceros, ni por
                    virus, malware u otros elementos maliciosos transmitidos a
                    través de dichos servidores.
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
                    delictivas por parte de los Profesionales, la Sociedad podrá
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
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    6. Naturaleza Independiente de los Profesionales:
                  </h3>
                  <p className="mb-4">
                    Los Profesionales que ofrecen sus servicios a través de la
                    Plataforma son profesionales independientes. No son
                    empleados, socios, representantes, agentes, franquiciados ni
                    asociados comerciales de la Empresa. La Sociedad actúa
                    exclusivamente como un facilitador de la Plataforma,
                    proporcionando un espacio para la visibilidad, programación,
                    cobro, pago y emisión de boletas, sin intervenir en la
                    prestación de los servicios profesionales.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  CLÁUSULA QUINTA. Obligaciones y prohibiciones del Profesional
                </h2>
                <div className="mb-4">
                  <p className="mb-4">
                    <strong>1.</strong> El Profesional deberá proveer a la
                    Plataforma de información actualizada y veraz sobre su
                    título profesional. Toda variación o cancelación del mismo
                    deberá ser informada a la brevedad, so pena de la medida del
                    punto 4 de esta cláusula.
                  </p>
                  <p className="mb-4">
                    <strong>2.</strong> El Profesional se compromete a asistir a
                    las sesiones agendadas. En caso de inasistencia, el valor
                    pagado por el Consultante será reembolsado a este, sin tener
                    el Profesional derecho a percibir comisión alguna.
                  </p>
                  <p className="mb-4">
                    <strong>3.</strong> El Profesional no podrá actuar en
                    representación de RAKIDIUM SpA, ni ceder o transferir su
                    usuario registrado en la Plataforma, ya sea permanente o
                    transitoriamente, ni concertar sesiones con Consultantes
                    fuera del entorno de la Plataforma.
                  </p>
                  <p className="mb-4">
                    <strong>4.</strong> El incumplimiento de cualquiera de estas
                    prohibiciones habilitarán a la Plataforma para cancelar el
                    perfil del Profesional.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  CLAUSULA SEXTA. Tratamiento de Datos Personales
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
                    2. Recopilación y Uso de Datos del Profesional:
                  </h3>
                  <div className="mb-4">
                    <p className="mb-2">
                      <strong>Datos Recolectados:</strong> La Plataforma
                      recopila datos personales del Profesional que son
                      esenciales para la creación y gestión de su cuenta en la
                      Plataforma, incluyendo RUT, teléfono, nombre, apellido,
                      correo electrónico, información y título profesional.
                      Además, el profesional también podrá facilitar su
                      información tributaria, a efectos de que la Plataforma
                      pueda emitir las boletas de honorarios por los servicios
                      que preste el Profesional al Consultante.
                    </p>
                    <p className="mb-4">
                      <strong>Base Legal:</strong> La base legal para el
                      tratamiento de estos datos es el consentimiento otorgado
                      por el Profesional al suscribir este acuerdo, siendo
                      necesario para la ejecución del mismo.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
