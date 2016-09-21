---
title: "IU Trident software suite: Projects"
layout: single
excerpt: "Projects & Prototypes"
sitemap: false
permalink: /projects
---

{% include base_path %}

<div id="main" role="main">
  <article class="splash" itemscope itemtype="http://schema.org/CreativeWork">
    {% if page.title %}<meta itemprop="headline" content="{{ page.title | markdownify | strip_html | strip_newlines | escape_once }}">{% endif %}
    {% if page.excerpt %}<meta itemprop="description" content="{{ page.excerpt | markdownify | strip_html | strip_newlines | escape_once }}">{% endif %}
    {% if page.date %}<meta itemprop="datePublished" content="{{ page.date | date: "%B %d, %Y" }}">{% endif %}
    {% if page.modified %}<meta itemprop="dateModified" content="{{ page.modified | date: "%B %d, %Y" }}">{% endif %}
            <section class="page__content" itemprop="text">
               <div class="feature__wrapper">
                  <div class="feature__item">
                     <div class="archive__item">
<!--                        <div class="archive__item-teaser"> <img src="https://mmistakes.github.io/minimal-mistakes/images/mm-customizable-feature.png" alt="customizable" /></div> -->
                        <div class="archive__item-body">
                           <a href="https://portal.odi.iu.edu" class="btn "><h2 class="archive__item-title">ODI-PPA</h2></a>
<!--                           <div class="archive__item-excerpt">
                              <p>One Degree Imager - Pipeline, Portal, and Archive</p>
                           </div>
-->                        </div>
                     </div>
                  </div>
                  <div class="feature__item">
                     <div class="archive__item">
                        <div class="archive__item-body">
                           <a href="https://portal.emcenter.iu.edu" class="btn "><h2 class="archive__item-title">EMC-SCA</h2></a>
                        </div>
                     </div>
                  </div>
    	       </div>
            </section>
            <section class="page__content" itemprop="text">
               <div class="feature__wrapper">
                  <div class="feature__item">
                     <div class="archive__item">
                        <div class="archive__item-body">
                           <a href="https://gcs-dev.ppa.iu.edu" class="btn "><h2 class="archive__item-title">GCS-SCA</h2></a>
                        </div>
                     </div>
                  </div>
                  <div class="feature__item">
                     <div class="archive__item">
                        <div class="archive__item-body">
                           <a href="https://sparc.sca.iu.edu" class="btn "><h2 class="archive__item-title">SpArc</h2></a>
                        </div>
                     </div>
                  </div>
    	       </div>
            </section>
            <section class="page__content" itemprop="text">
               <div class="feature__wrapper">
                  <div class="feature__item">
                     <div class="archive__item">
                        <div class="archive__item-body">
                           <a href="https://rady.sca.iu.edu" class="btn "><h2 class="archive__item-title">RADY-QC-SCA</h2></a>
                        </div>
                     </div>
                  </div>
		</div>
            </section>


  </article>
</div>
