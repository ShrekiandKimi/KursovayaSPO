import { Car, Shield, Users, TrendingUp, Phone, Mail, MapPin } from 'lucide-react';

export default function LandingPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-sky-600 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">ТаксоПарк</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">О нас</a>
            <a href="#services" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Услуги</a>
            <a href="#advantages" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Преимущества</a>
            <a href="#contact" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Контакты</a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('login')}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2 transition-colors"
            >
              Войти
            </button>
            <button
              onClick={() => onNavigate('register')}
              className="text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 px-5 py-2 rounded-lg transition-colors"
            >
              Регистрация
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Shield className="w-4 h-4" />
              Надёжный таксопарк с 2015 года
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Современный таксопарк<br />
              <span className="text-sky-600">для водителей и партнёров</span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-2xl">
              Мы предоставляем водителям всё необходимое для комфортной работы:
              современные автомобили, прозрачную систему выплат, гибкий график
              и круглосуточную поддержку. Присоединяйтесь к нашей команде.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => onNavigate('register')}
                className="px-8 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-sky-200"
              >
                Стать водителем
              </button>
              <button
                onClick={() => onNavigate('register')}
                className="px-8 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-colors"
              >
                Стать модератором
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '350+', label: 'Водителей' },
            { value: '500+', label: 'Автомобилей' },
            { value: '10K+', label: 'Поездок в месяц' },
            { value: '99%', label: 'Довольных водителей' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-sky-600 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">О нашем таксопарке</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Мы работаем для того, чтобы каждый водитель мог зарабатывать достойно
              и работать в комфортных условиях.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Car,
                title: 'Современный автопарк',
                desc: 'Новые автомобили с регулярным ТО, страховкой и полным комплектом документов. Мы заботимся о безопасности.',
              },
              {
                icon: TrendingUp,
                title: 'Прозрачные выплаты',
                desc: 'Чёткая система расчёта заработка. Вы всегда знаете, сколько заработали и когда получите выплату.',
              },
              {
                icon: Users,
                title: 'Поддержка 24/7',
                desc: 'Наша команда диспетчеров и механиков всегда на связи. Мы помогаем решать любые вопросы.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg hover:border-sky-200 transition-all group">
                <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-sky-100 transition-colors">
                  <item.icon className="w-6 h-6 text-sky-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Что мы предлагаем</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Полный набор инструментов и услуг для эффективной работы таксопарка.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Гибкий график работы', desc: 'Выбирайте удобные смены, планируйте выходные. Наша система позволяет адаптировать график под ваши потребности.' },
              { title: 'Система рейтингов', desc: 'Объективная оценка качества работы. Высокий рейтинг — больше заказов и бонусов.' },
              { title: 'Медосмотры и ТО', desc: 'Мы следим за сроками медицинских осмотров и технического обслуживания. Напоминания в личном кабинете.' },
              { title: 'Финансовая аналитика', desc: 'Подробная статистика доходов, расходов и выплат. Полный контроль над финансами.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-sky-200 transition-all">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section id="advantages" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Почему выбирают нас</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              'Комиссия ниже рынка',
              'Моментальные выплаты',
              'Новые автомобили',
              'Страхование водителя',
              'Бонусы за стаж',
              'Обучение и повышение квалификации',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 bg-sky-50 rounded-xl px-5 py-4">
                <div className="w-6 h-6 bg-sky-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-800">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Свяжитесь с нами</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Phone className="w-5 h-5 text-sky-600" />
              </div>
              <div className="text-sm text-gray-500 mb-1">Телефон</div>
              <div className="font-medium text-gray-900">+7 (800) 123-45-67</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Mail className="w-5 h-5 text-sky-600" />
              </div>
              <div className="text-sm text-gray-500 mb-1">Email</div>
              <div className="font-medium text-gray-900">info@taxopark.ru</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-5 h-5 text-sky-600" />
              </div>
              <div className="text-sm text-gray-500 mb-1">Адрес</div>
              <div className="font-medium text-gray-900">Москва, ул. Автозаводская, 12</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-sky-600 rounded-lg flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">ТаксоПарк</span>
          </div>
          <div className="text-sm">&copy; 2026 ТаксоПарк. Все права защищены.</div>
        </div>
      </footer>
    </div>
  );
}
